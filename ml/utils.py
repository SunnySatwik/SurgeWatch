import os

def get_project_root():
    """Returns the absolute path to the 'ml' folder."""
    return os.path.dirname(os.path.abspath(__file__))

def get_data_path(filename):
    """Returns the absolute path for a file in the data directory."""
    data_dir = os.path.join(get_project_root(), 'data')
    os.makedirs(data_dir, exist_ok=True)
    return os.path.join(data_dir, filename)

def get_model_path(filename):
    """Returns the absolute path for a file in the model directory."""
    model_dir = os.path.join(get_project_root(), 'model')
    os.makedirs(model_dir, exist_ok=True)
    return os.path.join(model_dir, filename)

def get_output_path(filename):
    """Returns the absolute path for a file in the root output directory (or ml root)."""
    # Placing forecast_output.json in ml root as requested
    return os.path.join(get_project_root(), filename)
