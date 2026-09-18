const express = require("express");
const path = require("path");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static("views"));

const FLASK_HOST = process.env.FLASK_HOST || "flask-backend-service";

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.post("/submit", async (req, res) => {
    try {
        const response = await fetch(
            `http://${FLASK_HOST}:5000/submit`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: new URLSearchParams({
                    name: req.body.name,
                    email: req.body.email
                })
            }
        );

        const result = await response.text();

        res.send(result);
    } catch (error) {
        console.error("Error connecting to Flask:", error);
        res.status(500).send("Could not connect to Flask backend");
    }
});

app.listen(3000, "0.0.0.0", () => {
    console.log("Frontend running on http://0.0.0.0:3000");
});