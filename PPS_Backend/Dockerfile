FROM python:3.12-slim

WORKDIR /app

# Instalar dependencias del sistema requeridas para psycopg2 y compilación
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements e instalar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código fuente del backend
COPY . .

# Exponer el puerto de FastAPI
EXPOSE 8000

# Comando para iniciar la aplicación (ejecutando migraciones al iniciar si es necesario o directamente el servidor)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
