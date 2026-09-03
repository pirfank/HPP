from flask import Flask, jsonify, request
import util

from flask_cors import CORS, cross_origin


app = Flask(__name__)

CORS(app)

util.load_saved_artifacts()


@app.route('/get_location_names')
def get_location_names():

    city = request.args.get('city')

    if not city:
        return jsonify({
            'error': 'City is required'
        }), 400

    try:

        locations = util.get_location_names(city)

        return jsonify({
            'location': locations
        })

    except ValueError as e:

        return jsonify({
            'error': str(e)
        }), 400


@app.route('/predict_home_price', methods=['POST'])
@cross_origin()
def predict_home_price():

    data = request.get_json()

    try:

        city = data['city']

        total_sqft = float(data['total_sqft'])

        location = data['location']

        bhk = int(data['bhk'])

        bath = int(data['bath'])

        estimated_price = util.get_estimated_price(
            city,
            location,
            total_sqft,
            bhk,
            bath
        )

        return jsonify({
            'estimated_price': estimated_price
        })

    except KeyError as e:

        return jsonify({
            'error': f'Missing field: {e.args[0]}'
        }), 400

    except (ValueError, TypeError) as e:

        return jsonify({
            'error': str(e)
        }), 400


if __name__ == "__main__":

    print(
        "Starting Python Flask server for home price prediction...."
    )

    app.run()