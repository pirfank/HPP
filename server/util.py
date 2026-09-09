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

    # Create feature vector
    x = np.zeros(len(data_columns))

    # Common features
    x[data_columns.index("total_sqft")] = sqft
    x[data_columns.index("bhk")] = bhk
    x[data_columns.index("bath")] = bath

    # Find location column
    location_column = None

    for column in data_columns:

        if city in ["delhi", "mumbai"]:

            # Delhi / Mumbai columns are like:
            # location_Alaknanda
            # location_Dwarka
            # location_Andheri West
            # location_Mira Road

            if column.lower() == f"location_{location}".lower():
                location_column = column
                break

        else:

            # Bengaluru / Chennai location columns
            # are stored directly as location names

            if column.lower() == location.lower():
                location_column = column
                break

    if location_column is None:
        raise ValueError(
            f"Invalid location '{location}' for {city.capitalize()}"
        )

    # Set selected location to 1
    x[data_columns.index(location_column)] = 1

    # Predict
    prediction = model.predict([x])[0]

    # Delhi model was trained on log1p(price)
    if city == "delhi":
        prediction = np.expm1(prediction)

    # Convert Delhi and Chennai to lakhs
    if city in ["delhi", "chennai", "mumbai"]:
        prediction = prediction / 100000

    return float(round(prediction, 2))


def get_location_names(city):

    city = city.lower()

    if city not in __locations:
        raise ValueError(f"Unsupported city: {city}")

    return __locations[city]


def load_saved_artifacts():

    print("Loading saved artifacts.... Start")

    global __models
    global __locations

    BASE_DIR = Path(__file__).resolve().parent.parent
    MODEL_DIR = BASE_DIR / "model"

    cities = [
        "bengaluru",
        "chennai",
        "delhi",
        "mumbai"
    ]

    for city in cities:

        city_dir = MODEL_DIR / city

        columns_path = city_dir / f"{city}_columns.json"

        # Delhi / Mumbai use .pkl
        if city in ["delhi", "mumbai"]:

            model_path = (
                city_dir /
                f"{city}_home_price_predictor.pkl"
            )

        else:

            model_path = (
                city_dir /
                f"{city}_home_price_predictor.pickle"
            )

        # Load columns
        with open(columns_path, "r") as f:

            columns_data = json.load(f)

        # Bengaluru / Chennai:
        # {"data_columns": [...]}
        #
        # Delhi / Mumbai:
        # [...]

        if isinstance(columns_data, dict):

            data_columns = columns_data["data_columns"]

        else:

            data_columns = columns_data

        # Load model
        with open(model_path, "rb") as f:

            model = pickle.load(f)

        # Store model
        __models[city] = {
            "columns": data_columns,
            "model": model
        }

        # Get location names
        if city in ["delhi", "mumbai"]:

            __locations[city] = [
                column.replace("location_", "", 1)
                for column in data_columns
                if column.startswith("location_")
            ]

        else:

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

        print(
            f"{city.capitalize()} model loaded "
            f"({len(data_columns)} features, "
            f"{len(__locations[city])} locations)"
        )

    print("Loading saved artifacts....done")


if __name__ == "__main__":
    load_saved_artifacts()