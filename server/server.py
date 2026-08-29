from flask import Flask, jsonify, request
import util
from flask_cors import CORS
from flask_cors import cross_origin

app = Flask(__name__)
CORS(app)
util.load_saved_artifacts()

@app.route('/get_location_names')
def get_location_names():
    response = jsonify({
        'location' : util.get_location_names()
    })
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/predict_home_price', methods=['POST'])
@cross_origin()
def predict_home_price():

    data = request.get_json()

    total_sqft = float(data['total_sqft'])
    location = data['location']
    bhk = int(data['bhk'])
    bath = int(data['bath'])

    response = jsonify({
        'estimated_price': util.get_estimated_price(
            location,
            total_sqft,
            bhk,
            bath
        )
    })

    return response

if __name__ == "__main__":
    print("Starting Python Flask server for home price prediction....")
    app.run()