from flask import Flask
from src.config import Config
from src.routes import main_bp

app = Flask(
    __name__,
    template_folder="src/templates",
    static_folder="src/static"
)

# Cargar configuración básica
app.secret_key = Config.SECRET_KEY
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = Config.SEND_FILE_MAX_AGE_DEFAULT

# Registrar rutas
app.register_blueprint(main_bp)

if __name__ == "__main__":
    print(f"Iniciando servidor en {Config.HOST}:{Config.PORT} (Debug: {Config.DEBUG})")
    app.run(host=Config.HOST, port=Config.PORT, debug=Config.DEBUG)
