# 🛠️ PMSP Backend - Motor de Simulación (Jigsaw Engine) & Tracking API

Este es el backend de la **Plataforma Multi-tenant de Simulación de Phishing (PMSP)**. Construido sobre **FastAPI**, proporciona una API REST asincrónica de alto rendimiento encargada de la lógica de negocio, persistencia en PostgreSQL, tokenización de campañas de simulación, envío SMTP multihilo y endpoints de interceptación/tracking.

---

## 🚀 Stack Tecnológico
* **Framework:** FastAPI (Python 3.12+)
* **Base de Datos:** PostgreSQL 15
* **ORM:** SQLAlchemy 2.0
* **Migraciones:** Alembic
* **Autenticación:** JWT (JSON Web Tokens) & Google OAuth2 (Authlib)
* **Envío de Correos:** SMTP (`smtplib` asíncrono vía `BackgroundTasks`)
* **Testing:** Pytest

---

## 📂 Estructura del Proyecto

```text
PPS_Backend/
├── app/
│   ├── core/              # Configuración base, seguridad (JWT) y conexión a DB
│   │   ├── config.py
│   │   ├── database.py
│   │   └── security.py
│   ├── models/            # Modelos ORM de SQLAlchemy
│   │   └── models.py
│   ├── schemas/           # Esquemas de validación Pydantic v2
│   │   └── schemas.py
│   ├── crud/              # Lógica de persistencia en base de datos y agregados
│   │   └── crud.py
│   ├── services/          # Envío de correos y reescritura de enlaces (SMTP Engine)
│   │   └── email_service.py
│   └── main.py            # Rutas, middlewares y punto de entrada de la aplicación
├── migrations/            # Historial de versiones de base de datos de Alembic
├── tests/                 # Suite de pruebas unitarias
│   └── test_simulation.py
├── .env                   # Variables de entorno locales
├── alembic.ini            # Configuración del gestor de migraciones
├── requirements.txt       # Dependencias del backend
└── Dockerfile             # Contenedor de producción
```

---

## ⚙️ Configuración (Archivo `.env`)

Crea un archivo `.env` en la raíz de `PPS_Backend/` con las siguientes variables:

```ini
DATABASE_URL=postgresql://admin:Sistemas1.@localhost:5432/phishing_quiz
SECRET_KEY=TuClaveSecretaSuperSegura
SUPERADMIN_EMAILS=tu-email@gmail.com
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8000
GOOGLE_CLIENT_ID=tu-google-client-id
GOOGLE_CLIENT_SECRET=tu-google-client-secret

# Configuración SMTP opcional para simulación real (Default: localhost:1025 para Mailhog)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASSWORD=
SMTP_USE_TLS=False
```

---

## 💻 Instalación y Ejecución Local

### 1. Preparar Entorno Virtual
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Ejecutar Migraciones de Base de Datos
```bash
alembic upgrade head
```

### 3. Iniciar el Servidor de Desarrollo
```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
La documentación interactiva de la API estará disponible en [http://localhost:8000/docs](http://localhost:8000/docs) (Swagger UI).

---

## 🧪 Ejecución de Pruebas Unitarias
Las pruebas están configuradas utilizando una base de datos SQLite en memoria para máxima velocidad.
```bash
# Ejecutar toda la suite de tests
PYTHONPATH=. ./venv/bin/pytest tests/test_simulation.py
```

---

## 🔗 Endpoints Críticos de la API

### 👤 Autenticación
* `GET /login`: Inicia el flujo de autenticación con Google SSO.
* `POST /auth/login`: Login manual tradicional mediante correo y contraseña.

### 👥 Destinatarios (Targets)
* `GET /targets/`: Retorna la lista de empleados asignados a la empresa del administrador logueado.
* `POST /targets/`: Crea un nuevo destinatario.
* `POST /targets/bulk`: Carga masiva de destinatarios (en formato JSON enviado desde el parseador CSV).
* `DELETE /targets/{id}`: Elimina un destinatario.

### 📧 Campañas y Simulaciones
* `GET /campaigns/`: Lista las campañas de simulación creadas por la empresa.
* `POST /campaigns/`: Crea una nueva campaña de simulación real (asociándole un escenario plantilla). Genera automáticamente tokens UUIDv4 únicos por destinatario.
* `POST /campaigns/{id}/launch`: Dispara el motor SMTP en segundo plano, inyectando píxeles invisibles, reescribiendo hipervínculos y enviando los correos de prueba.

### 🕵️ Endpoints de Tracking (Públicos)
* `GET /track/pixel/{token}`: Endpoint del píxel de apertura (retorna imagen transparente 1x1 GIF y registra evento `OPEN` asíncronamente).
* `GET /track/click/{token}`: Endpoint de redirección de clics (registra IP, navegador User-Agent, crea evento `CLICK` y redirige temporalmente al Quiz interactivo de concientización).

### 📊 Estadísticas
* `GET /stats/dashboard`: Retorna métricas analíticas agregadas (tasas de apertura y clics de las campañas de simulación, desglose de riesgo por departamento de la empresa y feed de los últimos 10 eventos de tracking).