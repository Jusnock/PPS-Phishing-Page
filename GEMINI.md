# PPS-GitGub - Instrucciones del Proyecto

Este proyecto es una plataforma de concientización sobre ciberseguridad (Phishing Quiz) con una arquitectura de microservicios (Backend en FastAPI y Frontend en React).

## Arquitectura

- **Backend:** FastAPI (Python 3.10+), SQLAlchemy (PostgreSQL).
- **Frontend:** React 19, Vite, Tailwind CSS.
- **Autenticación:** Híbrida (Manual + Google OAuth2) utilizando JWT.

## Convenciones de Desarrollo

1.  **Configuración:** Todas las variables sensibles (claves API, URLs de base de datos) deben estar en archivos `.env`.
    -   Backend: Usar `app/core/config.py` para cargar configuraciones.
    -   Frontend: Usar `import.meta.env.VITE_*` para variables de entorno.
2.  **Seguridad:**
    -   Nunca exponer tokens en URLs (preferir cabeceras Authorization o Cookies).
    -   Los roles de usuario son `SUPERADMIN`, `ADMIN_EMPRESA` y `EMPLEADO`.
3.  **Base de Datos:**
    -   Los modelos ORM residen en `app/models/models.py`.
    -   Las operaciones de base de datos (CRUD) deben estar en `app/crud/crud.py`.

## Gestión de Base de Datos (Alembic)

Hemos implementado **Alembic** para manejar las migraciones. Ya no se crean las tablas automáticamente al iniciar la app.

### Comandos útiles:

- **Generar una nueva migración** (después de cambiar un modelo):
  `alembic revision --autogenerate -m "Descripción del cambio"`
- **Aplicar cambios a la base de datos**:
  `alembic upgrade head`
- **Ver el historial de migraciones**:
  `alembic history`

## Mejoras Realizadas (Mayo 2026)

-   Centralización de configuraciones en `.env`.
-   Corrección de errores críticos en el flujo de cambio de contraseña obligatoria.
-   Limpieza de código duplicado en `main.py` y `crud.py`.
-   Sincronización de endpoints entre Frontend y Backend.

## Mejoras y Acciones Recientes (Junio 2026)

### 1. Replicación de Escenarios y Quizzes para CPCEMZA
Para poblar el tenant del **Consejo (cpcemza.org.ar - ID 9)**, se clonaron 11 escenarios de correo y 2 cuestionarios completos desde la base de datos de "Coca Cola" (ID 5) replicando sus enlaces en la tabla `quiz_scenarios`:
*   **11 Escenarios de correo:** Clonados a la empresa con ID 9 (Falso soporte IT, Alerta AFIP, Error de liquidación, SharePoint, Feriado legítimo, etc.).
*   **2 Cuestionarios (Quizzes):** Replicados y enlazados con las nuevas ID de escenarios pertenecientes a CPCEMZA.

### 2. Soporte para Envíos de Correo SMTP
Se identificó y solucionó un problema que impedía el envío de las campañas SMTP:
*   **Causa de falla de envío:** Al no haber destinatarios (`targets`) cargados en la empresa (CPCEMZA), se generaban 0 tokens de campaña y el despachador SMTP no se ejecutaba.
*   **Solución:** Se requiere registrar previamente al menos un destinatario en la pestaña **Gestión** del frontend.
*   **Configuración dinámica:** Se incorporaron las variables de SMTP en la clase `Settings` en [config.py](file:///home/jfvazquez/Escritorio/PPS-GitGub/PPS_Backend/app/core/config.py) y se habilitaron en el archivo [.env](file:///home/jfvazquez/Escritorio/PPS-GitGub/PPS_Backend/.env) del backend:
    *   `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_USE_TLS`.

### 3. Configuración para Envíos Reales con Google Workspace (`cpcemza.org.ar`)
Para enviar correos reales usando el dominio del Consejo, se documentan las siguientes dos opciones configurables en el [.env](file:///home/jfvazquez/Escritorio/PPS-GitGub/PPS_Backend/.env) del backend:

#### Opción A: Contraseña de Aplicación de cuenta individual (Ej: `admin@cpcemza.org.ar`)
1.  Habilitar Verificación en 2 pasos en el perfil de Google.
2.  Generar una *Contraseña de aplicación* en la sección Seguridad de la Cuenta de Google.
    *(Nota: Si no está disponible la opción, el administrador del dominio debe habilitar la generación de contraseñas de aplicación en `admin.google.com`).*
3.  Configuración en `.env`:
    ```env
    SMTP_HOST=smtp.gmail.com
    SMTP_PORT=587
    SMTP_USER=tu_cuenta@cpcemza.org.ar
    SMTP_PASSWORD=tu_clave_de_16_caracteres
    SMTP_USE_TLS=True
    ```

#### Opción B: Retransmisión SMTP de Google Workspace (Permite simular remitentes como `rrhh@cpcemza.org.ar`, `sistemas@cpcemza.org.ar`)
1.  Ingresar a la consola de administración (`admin.google.com`).
2.  Navegar a: **Apps > Google Workspace > Gmail > Routing** y configurar el **SMTP Relay Service**.
3.  Configurar para permitir *"Solo direcciones de correo en mis dominios"* y activar *"Exigir autenticación SMTP"*.
4.  Configuración en `.env`:
    ```env
    SMTP_HOST=smtp-relay.gmail.com
    SMTP_PORT=587
    SMTP_USER=tu_cuenta_admin@cpcemza.org.ar
    SMTP_PASSWORD=tu_clave_de_aplicacion
    SMTP_USE_TLS=True
    ```

