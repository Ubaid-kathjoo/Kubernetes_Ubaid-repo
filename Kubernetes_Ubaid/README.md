# Jenkins CI/CD Assignment — Flask + Express on EC2

## Overview

This project deploys a Flask backend and an Express frontend on a single manually-launched AWS EC2 instance, managed by **pm2**, with **Jenkins** running on the same instance to provide CI/CD via two separate pipelines. A GitHub webhook triggers both pipelines automatically on every push to the repository.

## Repository

Both applications live in a single GitHub repository:

**https://github.com/Ubaid-kathjoo/Kubernetes_Ubaid-repo**

| App     | Path                          |
|---------|--------------------------------|
| Flask backend   | `Kubernetes_Ubaid/backend/`  |
| Express frontend | `Kubernetes_Ubaid/frontend/` |

## Architecture

```
                    ┌─────────────────────────────────────────┐
                    │              EC2 Instance                 │
                    │         (Ubuntu 22.04, ap-south-1)         │
                    │                                             │
  GitHub  ───push──▶│  Jenkins (:8080)                           │
  Webhook            │    ├── flask-backend-pipeline              │
                    │    └── express-frontend-pipeline           │
                    │                                             │
                    │  pm2                                       │
                    │    ├── flask-backend   (Flask, :5000)      │
                    │    └── express-frontend (Express, :3000)   │
                    └─────────────────────────────────────────┘
```

- **Flask backend** — serves a `/submit` POST endpoint, renders `success.html`.
- **Express frontend** — serves a registration form (`index.html`) on `/`, and forwards form submissions to the Flask backend via a `FLASK_HOST` environment variable.
- **pm2** manages both app processes: keeps them running in the background, auto-restarts on crash, and survives instance reboots (`pm2 save` + `pm2 startup`).
- **Jenkins** runs as the `ubuntu` system user (not the default `jenkins` user) so its pipeline shell steps can directly control the same pm2 daemon that manages the running apps.

## AWS Details

- **Account region:** ap-south-1 (Mumbai)
- **Instance:** Ubuntu Server 22.04 LTS, t2.micro
- **Security group inbound rules:**
  | Port | Purpose            | Source          |
  |------|--------------------|-----------------|
  | 22   | SSH                | My IP           |
  | 3000 | Express frontend   | 0.0.0.0/0       |
  | 5000 | Flask backend      | 0.0.0.0/0       |
  | 8080 | Jenkins            | 0.0.0.0/0       |
- **Storage:** 20 GB gp3 root volume

---

## Part 1 — Manual EC2 Deployment

### 1. Launch EC2 instance
Launched manually via the AWS Console (not Terraform) with the AMI, instance type, key pair, security group, and storage described above.

### 2. Install prerequisites
SSH into the instance, then:

```bash
sudo apt update && sudo apt upgrade -y

# Git
sudo apt install -y git

# Python
sudo apt install -y python3 python3-pip python3-venv

# Node.js 18 (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# pm2 (global)
sudo npm install -g pm2
```

### 3. Clone the repository
```bash
cd ~
git clone https://github.com/Ubaid-kathjoo/Kubernetes_Ubaid-repo.git
cd Kubernetes_Ubaid-repo/Kubernetes_Ubaid
```

### 4. Set up and run the Flask backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate

pm2 start venv/bin/python3 --name flask-backend -- app.py
```

### 5. Set up and run the Express frontend
```bash
cd ../frontend
npm install

FLASK_HOST=http://localhost:5000 pm2 start server.js --name express-frontend
```

### 6. Persist pm2 across reboots
```bash
pm2 save
pm2 startup
# run the sudo command it prints, then:
pm2 save
```

### 7. Verify
```bash
pm2 status
```
Both `flask-backend` and `express-frontend` should show `online`. The form is reachable at `http://<EC2_PUBLIC_IP>:3000`.

---

## Part 2 — Jenkins CI/CD Setup

### 1. Install Java and Jenkins
```bash
sudo apt install -y openjdk-21-jre

sudo wget -O /usr/share/keyrings/jenkins-keyring.asc \
  https://pkg.jenkins.io/debian-stable/jenkins.io-2026.key

echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc]" \
  https://pkg.jenkins.io/debian-stable binary/ | sudo tee \
  /etc/apt/sources.list.d/jenkins.list > /dev/null

sudo apt update
sudo apt install -y jenkins
```

### 2. Run Jenkins as the `ubuntu` user
So that pipeline shell steps can control the same pm2 processes managing the live apps:

- `/etc/default/jenkins` → `JENKINS_USER=ubuntu`
- `/usr/lib/systemd/system/jenkins.service` → `User=ubuntu`, `Group=ubuntu`
- `sudo chown -R ubuntu:ubuntu /var/lib/jenkins /var/log/jenkins`
- `sudo systemctl daemon-reload && sudo systemctl start jenkins`

### 3. Initial setup
- Access Jenkins at `http://<EC2_PUBLIC_IP>:8080`
- Unlock using `sudo cat /var/lib/jenkins/secrets/initialAdminPassword`
- Install suggested plugins, create an admin user

### 4. Pipeline jobs
Two Pipeline jobs were created, each configured with **Pipeline script from SCM**:

| Job | Repository | Script Path |
|---|---|---|
| `flask-backend-pipeline` | this repo | `Kubernetes_Ubaid/backend/Jenkinsfile` |
| `express-frontend-pipeline` | this repo | `Kubernetes_Ubaid/frontend/Jenkinsfile` |

Both jobs have **"GitHub hook trigger for GITScm polling"** enabled under Build Triggers.

### 5. Jenkinsfiles

**`backend/Jenkinsfile`**
```groovy
pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                    cd Kubernetes_Ubaid/backend
                    python3 -m venv venv
                    . venv/bin/activate
                    pip install -r requirements.txt
                '''
            }
        }

        stage('Restart App') {
            steps {
                sh '''
                    pm2 restart flask-backend || pm2 start Kubernetes_Ubaid/backend/venv/bin/python3 --name flask-backend -- Kubernetes_Ubaid/backend/app.py
                '''
            }
        }
    }

    post {
        success {
            echo 'Flask backend deployed successfully!'
        }
        failure {
            echo 'Flask backend deployment failed.'
        }
    }
}
```

**`frontend/Jenkinsfile`**
```groovy
pipeline {
    agent any

    environment {
        FLASK_HOST = 'http://localhost:5000'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                    cd Kubernetes_Ubaid/frontend
                    npm install
                '''
            }
        }

        stage('Restart App') {
            steps {
                sh '''
                    cd Kubernetes_Ubaid/frontend
                    pm2 restart express-frontend --update-env || FLASK_HOST=http://localhost:5000 pm2 start server.js --name express-frontend
                '''
            }
        }
    }

    post {
        success {
            echo 'Express frontend deployed successfully!'
        }
        failure {
            echo 'Express frontend deployment failed.'
        }
    }
}
```

### 6. GitHub Webhook

- **Repo Settings → Webhooks → Add webhook**
- **Payload URL:** `http://<EC2_PUBLIC_IP>:8080/github-webhook/`
- **Content type:** `application/json`
- **Events:** Just the push event

On every push to `main`, GitHub notifies Jenkins, which automatically triggers both `flask-backend-pipeline` and `express-frontend-pipeline`. Each pipeline pulls the latest code, reinstalls dependencies, and restarts its app via pm2 — with zero manual intervention.

---

## How to Verify

1. **Apps are live:** visit `http://<EC2_PUBLIC_IP>:3000`, submit the form, confirm the success page renders (proves Flask + Express are communicating).
2. **pm2 status:** `pm2 status` on the instance shows both processes `online`.
3. **Jenkins pipelines:** both jobs show green ("Finished: SUCCESS") in their build history.
4. **CI/CD trigger:** push any commit to the repo's `main` branch — new builds appear automatically in both pipelines within seconds, labeled "Started by GitHub push."

## Environment Variables

| Variable | Used by | Purpose |
|---|---|---|
| `FLASK_HOST` | Express frontend | Full base URL of the Flask backend (e.g. `http://localhost:5000`), since both apps run on the same host |

---

## Author
Ubaid
