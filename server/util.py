import json
import pickle
import numpy as np
import warnings

warnings.filterwarnings(
    "ignore",
    message="X does not have valid feature names"
)

__locations = None
__data_columns = None
__model = None

def get_estimated_price(location, sqft, bhk, bath):
    try:
        loc_index = __data_columns.index(location.lower())
    except:
        loc_index = -1
    x_ = np.zeros (len(__data_columns))
    x_[0] = sqft
    x_[1] = bath
    x_[2] = bhk
    if loc_index >= 0:
        x_[loc_index] = 1
    return round(__model.predict([x_])[0], 2)

def get_location_names():
    return __locations

def load_saved_artifacts():
    print('Loading saved artifacts.... Start')
    global __data_columns
    global __locations
    global __model
    with open ('./artifacts/bengaluru_columns.json', 'r') as f:
        __data_columns = json.load(f)['data_columns']
        __locations = __data_columns[3: ]
    with open('./artifacts/bengaluru_home_price_predicter.pickle', 'rb') as f:
        __model = pickle.load(f)

    print('Loading saved artifacts....done')

if __name__ == '__main__':
    load_saved_artifacts()