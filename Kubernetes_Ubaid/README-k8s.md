# Kubernetes Deployment of Flask + Express Application

## 📌 Project Overview

This project demonstrates the deployment of a **full-stack application** on a local Kubernetes cluster using **Minikube**.

The application consists of:

* **Frontend:** Express.js / Node.js
* **Backend:** Flask (Python)
* **Containerization:** Docker
* **Orchestration:** Kubernetes
* **Local Cluster:** Minikube

The frontend is exposed using a **NodePort Service**, while the backend is exposed internally using a **ClusterIP Service**. Communication between frontend and backend is performed using **Kubernetes DNS**.

---

## 🛠 Technologies Used

* Windows 11 Pro
* Git Bash
* Docker Desktop
* Docker
* Kubernetes
* Minikube
* kubectl
* Flask (Python)
* Express.js (Node.js)

---

## 📂 Project Structure

```text
Kubernetes_Ubaid/
│
├── backend/
│   ├── Dockerfile
│   ├── app.py
│   ├── templates/
│   └── ...
│
├── frontend/
│   ├── Dockerfile
│   ├── server.js
│   ├── package.json
│   ├── package-lock.json
│   ├── views/
│   └── index.html
│
├── k8s/
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   ├── frontend-deployment.yaml
│   └── frontend-service.yaml
│
└── README.md
```

---

## 🐳 Docker Images

The following Docker images were used:

```text
flask-backend:latest
express-frontend:v2
```

---

## ☸ Kubernetes Resources

### Backend

#### Deployment

```text
flask-backend
```

#### Service

```text
flask-backend-service
Type: ClusterIP
Port: 5000
```

---

### Frontend

#### Deployment

```text
express-frontend
```

#### Service

```text
express-frontend-service
Type: NodePort
Port: 3000
NodePort: 30104
```

---

## 🌐 Application Architecture

```text
Windows Browser
       │
       ▼
Minikube Tunnel / NodePort
       │
       ▼
Express Frontend Pod :3000
       │
       │ Kubernetes DNS
       ▼
flask-backend-service:5000
       │
       ▼
Flask Backend Pod :5000
```

---

## 🚀 Start Minikube

```bash
minikube start --driver=docker
```

Check status:

```bash
minikube status
```

---

## 🐳 Build Docker Images

### Backend

```bash
docker build -t flask-backend:latest ./backend
```

### Frontend

```bash
docker build -t express-frontend:v2 ./frontend
```

---

## 📦 Load Images into Minikube

```bash
minikube image load flask-backend:latest
minikube image load express-frontend:v2
```

---

## ☸ Deploy to Kubernetes

```bash
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml

kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml
```

---

## 🔍 Verify Deployment

```bash
kubectl get nodes
kubectl get pods
kubectl get deployments
kubectl get services
kubectl get endpoints
```

---

## 🌍 Access Frontend

```bash
minikube service express-frontend-service --url
```

Example:

```text
http://127.0.0.1:xxxxx
```

Keep the terminal open while using the application.

---

## 🔗 Frontend to Backend Communication

The frontend submits data to:

```text
POST /submit
```

Express forwards the request internally to:

```text
http://flask-backend-service:5000/submit
```

Kubernetes DNS resolves:

```text
flask-backend-service
```

to the Flask backend Service.

---

## ✅ Successful Verification

The following components were verified successfully:

* Minikube Running
* Kubernetes Node Ready
* Frontend Pod Running
* Backend Pod Running
* Frontend Service (NodePort)
* Backend Service (ClusterIP)
* Kubernetes DNS Resolution
* Express → Flask Communication
* Browser Form Submission

---

## 📸 Screenshots Included

The documentation contains screenshots for:

* Minikube Status
* Kubernetes Node
* Pods
* Deployments
* Services
* Endpoints
* YAML Files
* Docker Images
* Minikube Images
* Browser Form
* Successful Submission
* Logs
* Internal Communication Tests

---

## 👨‍💻 GitHub Repository

Add your GitHub repository link here:

```text
https://github.com/your-username/your-repository-name
```

---

## 🎯 Conclusion

This project successfully demonstrates the deployment of a Flask + Express full-stack application using Docker, Kubernetes, and Minikube. The frontend is exposed through a NodePort Service, while the backend remains internal using a ClusterIP Service. Kubernetes DNS enables communication between services, and the final browser test confirms successful end-to-end functionality.
