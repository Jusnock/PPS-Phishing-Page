# Historial de Conversación y Avance de Proyecto

Este documento contiene un registro estructurado de las solicitudes, correcciones técnicas y entregables realizados durante el desarrollo de la documentación de la **Plataforma de Concientización sobre Ciberseguridad (Phishing Simulator & Quiz)** para el **CPCE Mendoza**.

---

## 📅 Registro Cronológico de Solicitudes y Resoluciones

### 1. Solicitud Inicial
* **Requerimiento:** Crear una documentación exhaustiva y profesional para el reporte de la Práctica Profesional Supervisada (PPS) en formato `.docx` (Word editable). Debe incluir marcadores visuales específicos para la posterior inserción de capturas de pantalla de la plataforma.
* **Resolución:** Se configuró un entorno virtual con `python-docx` y se desarrolló un script en Python (`generate_doc.py`) para compilar de forma automatizada un documento estructurado de unas 10-15 páginas con la tipografía y colores institucionales del CPCE.

### 2. Manuales de Usuario
* **Requerimiento:** Verificar la inclusión de manuales de usuario y proponer contenido adicional relevante.
* **Resolución:** Se dividió la documentación operativa en manuales separados por perfiles de usuario: un **Manual de Administrador** (Consola de Gestión, CSV, Campañas) y un **Manual de Empleado** (Quiz interactivo, Sandbox de correo, tooltips de pistas).

### 3. Depuración de Secciones Incompletas y Páginas Vacías
* **Requerimiento:** Se detectó que algunas páginas estaban en blanco y que las secciones 7 y 8 prácticamente no contenían información.
* **Resolución:** 
  * Se identificó un error de compilación (`NameError: name 'variables_data' is not defined`) introducido en una reestructuración previa del script que impedía actualizar el archivo `.docx` en el escritorio.
  * Se restauraron las matrices de datos de configuración de variables (`variables_data`) y de roles/permisos (`roles_data`).
  * Se depuraron los saltos de página redundantes (`add_page_break()`), limitándolos únicamente al inicio de cada una de las 12 secciones principales.
  * Se ejecutó el compilador con éxito, generando el documento final de **185 párrafos** y **23 tablas**.

---

## 📖 Estructura del Documento Generado

El archivo final guardado en tu sistema es:
📁 **[Documentacion_Plataforma_Phishing.docx](file:///home/jfvazquez/Escritorio/PPS-Phishing-Page/Documentacion_Plataforma_Phishing.docx)**

La estructura interna del documento consta de las siguientes secciones secuenciales:
1. **Portada:** Logotipo conceptual, título formal de la PPS, institución y estado de despliegue.
2. **1. Introducción y Propósito del Sistema:** Objetivos generales de concientización y división interactiva (Simulador SMTP y Quiz).
3. **2. Arquitectura del Ecosistema e Infraestructura:** Tecnologías (FastAPI, React 19, Postgres 15), dockerización (Docker Compose) y topología de red local (Windows Server DNS + Apache2 Proxy).
4. **3. Esquema de Base de Datos y Diccionario de Datos:** Explicación técnica y diccionario de datos detallado de las 7 tablas del sistema.
5. **4. Referencia de Endpoints de la API Backend:** Tabla explicativa de los 16 endpoints clave de FastAPI.
6. **5. Seguridad y SSL en Red Local:** Hashing de claves (Bcrypt), tokens JWT y generación de certificados SSL auto-firmados con campos **SAN (Subject Alternative Name)**.
7. **6. Integración con Google OAuth2 y SSO:** Flujo de inicio de sesión con con cuentas corporativas e instrucciones de registro en Google Cloud Console.
8. **7. Guía de Configuración del Archivo de Entorno (.env):** Tabla de 17 variables sensibles del sistema (puertos, SMTP de retransmisión de Google, base de datos).
9. **8. Modelo de Roles y Permisos (Estructura Multi-Tenant):** Matriz de perfiles (SuperAdmin, Admin, Empleado) y el funcionamiento del **Rol Dual** del Consejo.
10. **9. Manual de Usuario: Rol Administrador:** Carga masiva de destinatarios vía CSV, gestión de plantillas HTML y encolamiento de campañas en Background.
11. **10. Manual de Usuario: Rol Empleado:** Acceso al Quiz, Sandbox de correos simulados, visualización interactiva de pistas en tooltips y estadísticas de resiliencia finales.
12. **11. Estrategia de Backups y Mantenimiento de Base de Datos:** Script automático en Bash utilizando `pg_dump` programado en `Cron`.
13. **12. Puesta en Marcha y Guía de Mantenimiento Técnico:** Comandos rápidos de Docker Compose, control de migraciones con Alembic y troubleshooting de errores comunes.

---

## 📋 Plantilla para Actualización en Trello

Copia y pega el siguiente texto en tu tarjeta de Trello para reportar los avances a tu jefe:

```markdown
### 📝 Avance: Documentación Técnica y Manuales de Usuario (PPS Phishing Platform)

**Descripción del Avance:**
Se ha completado la generación del manual técnico y operativo de la plataforma en formato editable (`.docx`). El documento abarca de manera exhaustiva todo el desarrollo de la Práctica Profesional Supervisada (PPS) para el **CPCE Mendoza**, detallando la arquitectura de microservicios, seguridad, configuración de red interna y los manuales de usuario.

---

#### 📁 Entregables y Estructura del Documento Generado:
1. **Introducción y Marco de la PPS:** Contexto del proyecto y objetivos de concientización.
2. **Arquitectura y Dockerización:** Detalle técnico de los contenedores (React 19, FastAPI y PostgreSQL 15) expuestos mediante Docker Compose.
3. **Estructura de Red y DNS LAN:** Configuración de la redirección con Apache2 (Proxy Inverso HTTPS) y técnica *DNS Pinpoint* (zonas en Windows Server).
4. **Persistencia (Diccionario de Datos):** Tabla de base de datos detallada con las 7 entidades relacionales (`companies`, `users`, `scenarios`, etc.) y sus tipos de datos.
5. **Referencia de la API:** Detalle de los 16 endpoints clave del backend (métodos HTTP, rutas, alcances y permisos).
6. **Seguridad y Cifrado:**
   * Criptografía con Bcrypt y firmas de tokens JWT.
   * Generación de certificado SSL auto-firmado local utilizando la extensión **SAN (Subject Alternative Name)** para compatibilidad con navegadores modernos.
7. **SSO con Google Workspace (OAuth2):** Flujo de redirección segura con el middleware HTTPS en FastAPI y registro en Google Cloud Console.
8. **Configuración de Variables de Entorno (`.env`):** Tabla interactiva con el detalle de configuración de puertos, base de datos y envío de correos mediante SMTP Relay de Google.
9. **Modelo Multi-Tenant y Permisos:** Jerarquización de los perfiles (`SUPERADMIN`, `ADMIN_EMPRESA`, `EMPLEADO`) e implementación del **Rol Dual** para la gestión del dominio del Consejo.
10. **Manuales de Usuario Operativos:**
    * **Rol Administrador:** Pasos para ingresar al panel, auditar estadísticas de simulaciones mediante el Dashboard, importación masiva de destinatarios vía archivo CSV, y laboratorio de creación/lanzamiento de campañas.
    * **Rol Empleado:** Experiencia del usuario final en el Quiz interactivo (ingreso vía SSO, sandbox de correo simulado, pistas didácticas en tooltip y pantalla de resultados).
11. **Estrategia de Backups:** Automatización de copias de seguridad de Postgres mediante script en Bash (`pg_dump` + compresión) programado diariamente a través de `Cron`.
12. **Guía de Despliegue y Troubleshooting:** Comandos rápidos de Docker Compose, control de migraciones con Alembic y resolución de problemas frecuentes de red y SSL.

---

#### ⏭️ Próximos Pasos (To-Do en Trello):
* [ ] Abrir el documento editable [Documentacion_Plataforma_Phishing.docx](file:///home/jfvazquez/Escritorio/PPS-Phishing-Page/Documentacion_Plataforma_Phishing.docx).
* [ ] Tomar capturas de pantalla de la plataforma en el entorno local (DNS corporativo, consola Google Cloud, dashboard, editor HTML, quiz de empleados y pistas) y reemplazarlas sobre los marcadores de posición (*placeholders*) rosa diseñados en el manual.
* [ ] Realizar la revisión final y exportar a formato PDF para la entrega final de la PPS.
```
