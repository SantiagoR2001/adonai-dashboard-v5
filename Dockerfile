# Imagen base oficial de Python (ligera)
FROM python:3.12-slim

# Establecer directorio de trabajo en el contenedor
WORKDIR /app

# Instalar dependencias del sistema operativo que puedan ser requeridas por pandas o reportlab
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copiar el archivo de dependencias
COPY requirements.txt .

# Instalar las librerías de Python
RUN pip install --no-cache-dir -r requirements.txt

# Crear la carpeta data (el punto de montaje del volumen)
RUN mkdir -p /app/data

# Copiar el resto del código fuente a la imagen
COPY src/ /app/src/
COPY wsgi.py /app/

# Variables de entorno
ENV HOST=0.0.0.0
ENV PORT=5000
ENV FLASK_DEBUG=False
# PYTHONPATH asegura que los módulos locales se encuentren correctamente
ENV PYTHONPATH=/app

# Exponer el puerto
EXPOSE 5000

# Comando para iniciar la aplicación en modo producción usando Gunicorn
# 4 workers son suficientes para una carga moderada
CMD ["gunicorn", "--workers=4", "--bind=0.0.0.0:5000", "wsgi:app"]
