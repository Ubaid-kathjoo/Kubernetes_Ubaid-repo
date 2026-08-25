from flask import Flask, request, render_template

app = Flask(__name__)

@app.route('/submit', methods=['POST'])
def submit():

    name = request.form['name']
    email = request.form['email']

    print("Name:", name)
    print("Email:", email)

    return render_template('success.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)