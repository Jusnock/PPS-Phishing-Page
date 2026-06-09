# Plataforma de Concientización sobre Ciberseguridad (Phishing Simulator & Quiz)

Este proyecto corresponde al desarrollo de la **Práctica Profesional Supervisada (PPS)** de la carrera de Ingeniería en Sistemas de Información (5.° año). Es una solución integral diseñada para evaluar, medir y mejorar la concientización sobre ciberseguridad dentro de organizaciones y empresas, implementada inicialmente para el personal de una institución profesional.

La plataforma permite diseñar simulaciones de campañas de Phishing (envíos controlados de correos simulados) y ofrece un panel de autoevaluación interactivo (Quiz) para que los destinatarios aprendan a reconocer correos maliciosos en su día a día.

---

## 🏗️ Arquitectura y Tecnologías

El sistema utiliza una arquitectura moderna basada en microservicios y contenedores:

*   **Backend:** FastAPI (Python 3.10+), SQLAlchemy (ORM) y Alembic (Migraciones de base de datos).
*   **Frontend:** React 19, Vite, Tailwind CSS para el diseño responsivo y premium.
*   **Base de Datos:** PostgreSQL 15.
*   **Orquestación:** Docker y Docker Compose para asegurar un despliegue rápido y consistente en cualquier servidor Linux.

---

## ✨ Características Principales

*   **Panel de Administración (Dashboard):** Visualización interactiva de estadísticas en tiempo real:
    *   Tasa de apertura de correos de simulación.
    *   Tasa de clics en enlaces sospechosos (CTR).
    *   Aciertos y rendimiento del cuestionario de concientización.
*   **Gestión de Destinatarios (Targets) y Empresas:** Administración de empleados y agrupamiento por organizaciones/tenants.
*   **Generación de Campañas SMTP**: Soporte para envíos masivos simulados usando servidores de correo tradicionales o de retransmisión (SMTP Relay).
*   **Autenticación Híbrida:** Inicio de sesión manual mediante credenciales seguras y soporte opcional para **Google Workspace OAuth2**.
*   **Flujo de Cambio Obligatorio de Contraseña:** Medida de seguridad que fuerza a los nuevos usuarios a actualizar su clave provisional en su primer inicio de sesión.

---

## 🚀 Instalación y Despliegue en Servidor

Esta plataforma cuenta con un **instalador interactivo en Bash** que facilita la configuración de las variables de entorno necesarias para la base de datos, el servidor de correos (SMTP) y los puertos del sistema sin exponer secretos.

### Prerrequisitos
Asegúrate de tener instalados en tu servidor:
*   [Docker](https://docs.docker.com/engine/install/)
*   [Docker Compose](https://docs.docker.com/compose/install/)

### Pasos para Instalar:

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/Jusnock/PPS-Phishing-Page.git
    cd PPS-Phishing-Page
    ```

2.  **Ejecutar el Instalador Interactivo:**
    ```bash
    ./install.sh
    ```
    *El script te guiará solicitando puertos, URLs del servidor, correos de superadministradores y configuración SMTP. Generará de manera automática contraseñas de base de datos seguras y la clave secreta del JWT.*

3.  **Verificar los Contenedores:**
    Si decidiste iniciar los servicios durante el instalador, verifica que estén corriendo correctamente:
    ```bash
    docker compose ps
    ```
    Si elegiste iniciarlos después, puedes hacerlo con:
    ```bash
    docker compose up -d --build
    ```

---

## 🔒 Buenas Prácticas de Seguridad Aplicadas

*   **Centralización de Parámetros:** Todas las configuraciones sensibles se manejan a través de un único archivo `.env` en la raíz del proyecto, el cual es inyectado a los contenedores mediante Docker Compose.
*   **Exclusión de Secretos en Git:** El archivo `.env` está configurado en el `.gitignore` de la raíz del proyecto para evitar que credenciales, contraseñas de bases de datos o llaves de aplicaciones SMTP se suban por error al control de versiones.
*   **Permisos de Lectura Restringidos:** El instalador aplica automáticamente permisos de sistema `chmod 600` al archivo `.env`, lo que significa que solo el usuario propietario que realiza el despliegue en el servidor Linux puede leerlo.
*   **Generación Dinámica de Llaves:** Las claves secretas criptográficas (`SECRET_KEY` de JWT) y contraseñas de base de datos por defecto son generadas en el momento de instalación utilizando entropía segura del sistema (`openssl` o `/dev/urandom`).

---

## 📧 Configuración de Correo SMTP para Campañas

Para ejecutar campañas de simulación de correo real, edita los valores SMTP generados en el archivo `.env`. A continuación, se detallan dos configuraciones recomendadas:

### Opción A: Contraseña de Aplicación de cuenta individual (Ej: Gmail)
1.  Habilita la Verificación en 2 pasos de la cuenta administradora de correo.
2.  Genera una **Contraseña de Aplicación** (16 caracteres) en la sección de Seguridad de la Cuenta de Google.
3.  Configura en el `.env`:
    ```env
    SMTP_HOST=smtp.gmail.com
    SMTP_PORT=587
    SMTP_USER=tu_cuenta@tu-dominio.com
    SMTP_PASSWORD=tu_clave_de_16_caracteres
    SMTP_USE_TLS=True
    ```

### Opción B: Retransmisión SMTP de Google Workspace (SMTP Relay)
*Permite simular remitentes dinámicos dentro de tus dominios verificados (por ejemplo: `rrhh@tu-dominio.com`, `soporte@tu-dominio.com`).*
1.  Ingresa a tu Consola de Administración (`admin.google.com`).
2.  Ve a **Apps > Google Workspace > Gmail > Routing** y activa el **SMTP Relay Service**.
3.  Configura para permitir *Solo direcciones de correo en mis dominios* y activa *Exigir autenticación SMTP*.
4.  Configura en el `.env`:
    ```env
    SMTP_HOST=smtp-relay.gmail.com
    SMTP_PORT=587
    SMTP_USER=tu_cuenta_admin@tu-dominio.com
    SMTP_PASSWORD=tu_clave_de_aplicacion
    SMTP_USE_TLS=True
    ```

---

## 🛠️ Desarrollo Local (Sin Docker)

Si deseas levantar los servicios manualmente para desarrollo:

### Backend
1.  Ingresa a la carpeta: `cd PPS_Backend`
2.  Crea un entorno virtual e instala dependencias:
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    ```
3.  Configura el archivo `.env` local en la carpeta `PPS_Backend/`.
4.  Aplica las migraciones: `alembic upgrade head`
5.  Inicia el servidor: `uvicorn app.main:app --reload`

### Frontend
1.  Ingresa a la carpeta: `cd PPS_Frontend`
2.  Instala las dependencias de Node:
    ```bash
    npm install
    ```
3.  Configura la URL de desarrollo en `PPS_Frontend/.env`.
4.  Inicia el servidor de desarrollo:
    ```bash
    npm run dev
    ```
