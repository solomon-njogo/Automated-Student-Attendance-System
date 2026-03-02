from flask import Flask, jsonify

app = Flask(__name__)


@app.route("/", methods=["GET"])
def index():
    return jsonify({"message": "Automated Student Attendance System API is running."})


if __name__ == "__main__":
    app.run(debug=True)

