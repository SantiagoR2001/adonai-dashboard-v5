import os
from pathlib import Path

# Directorio raíz del proyecto (padre de src/)
BASE_DIR = Path(__file__).resolve().parent.parent

class Config:
    # Flask settings
    SECRET_KEY = os.environ.get("SECRET_KEY", "adonai_secret_key_2025")
    DEBUG = os.environ.get("FLASK_DEBUG", "True").lower() in ("true", "1", "t")
    PORT = int(os.environ.get("PORT", 5000))
    HOST = os.environ.get("HOST", "0.0.0.0")

    # Rutas de datos
    DATA_DIR = BASE_DIR / "data"
    EXCEL_FILE = DATA_DIR / "adonai_data_completo.xlsx"
    USUARIOS_FILE = DATA_DIR / "usuarios.json"
    
    # Prevenir que la cache de estáticos moleste en desarrollo
    SEND_FILE_MAX_AGE_DEFAULT = 0
