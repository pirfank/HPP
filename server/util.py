import json
import pickle
import numpy as np
import warnings
from pathlib import Path


warnings.filterwarnings(
    "ignore",
    message="X does not have valid feature names"
)


__models = {}
__locations = {}


def get_estimated_price(city, location, sqft, bhk, bath):

    city = city.lower()

    if city not in __models:
        raise ValueError(f"Unsupported city: {city}")

    data_columns = __models[city]["columns"]
    model = __models[city]["model"]

    # Find location column
    try:
        loc_index = data_columns.index(location.lower())
    except ValueError:
        loc_index = -1

    # Create feature vector
    x = np.zeros(len(data_columns))

    # IMPORTANT:
    # Assign values using column names rather than fixed indexes.
    # This works even if Bengaluru and Chennai have different
    # column orders.
    x[data_columns.index("total_sqft")] = sqft
    x[data_columns.index("bhk")] = bhk
    x[data_columns.index("bath")] = bath

    # Set selected location to 1
    if loc_index >= 0:
        x[loc_index] = 1

    # Predict price
    prediction = model.predict([x])[0]

    # Chennai model was trained using rupees.
    # Bengaluru model already returns lakhs.
    if city == "chennai":
        prediction = prediction / 100000

    return round(prediction, 2)


def get_location_names(city):

    city = city.lower()

    if city not in __locations:
        raise ValueError(f"Unsupported city: {city}")

    return __locations[city]


def load_saved_artifacts():

    print("Loading saved artifacts.... Start")

    global __models
    global __locations

    # HPP/
    # ├── model/
    # │   ├── bengaluru/
    # │   └── chennai/
    # └── server/
    #     └── util.py

    BASE_DIR = Path(__file__).resolve().parent.parent
    MODEL_DIR = BASE_DIR / "model"

    cities = [
        "bengaluru",
        "chennai"
    ]

    for city in cities:

        city_dir = MODEL_DIR / city

        columns_path = city_dir / f"{city}_columns.json"
        model_path = city_dir / f"{city}_home_price_predictor.pickle"

        # Load columns
        with open(columns_path, "r") as f:
            data_columns = json.load(f)["data_columns"]

        # Load model
        with open(model_path, "rb") as f:
            model = pickle.load(f)

        # Store model and columns
        __models[city] = {
            "columns": data_columns,
            "model": model
        }

        # Get only location columns
        core_columns = {
            "total_sqft",
            "bhk",
            "bath"
        }

        __locations[city] = [
            column
            for column in data_columns
            if column not in core_columns
        ]

        print(f"{city.capitalize()} model loaded")

    print("Loading saved artifacts....done")


if __name__ == "__main__":
    load_saved_artifacts()