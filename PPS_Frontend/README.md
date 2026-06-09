# 🎨 PMSP Frontend - Consola de Administración y Visualización de Métricas

Este es el frontend de la **Plataforma Multi-tenant de Simulación de Phishing (PMSP)**. Diseñado con una interfaz de estética brutalista y moderna, permite a los administradores de organizaciones gestionar listas de colaboradores, diseñar escenarios simulados de correo, disparar campañas reales vía SMTP y visualizar mapas de riesgo departamentales.

---

## 🚀 Stack Tecnológico
* **Framework principal:** React 19
* **Empaquetador y Entorno de Desarrollo:** Vite
* **Estilos (CSS):** Vanilla CSS y TailwindCSS para máxima adaptabilidad
* **Librería de Gráficos:** Recharts (SVG responsivos)
* **Iconografía:** Lucide React
* **Cliente HTTP:** Axios (con interceptores automáticos de cabeceras JWT)

---

## 📂 Estructura del Proyecto

```text
PPS_Frontend/
├── src/
│   ├── api/               # Instancia de Axios con interceptor para tokens JWT
│   │   └── axios.js
│   ├── components/        # Componentes compartidos de la UI (Navbar, Layout, Modals)
│   │   ├── Navbar.jsx
│   │   └── LayoutCorporativo.jsx
│   ├── pages/             # Vistas principales de la SPA
│   │   ├── Login.jsx      # Login manual y Google OAuth
│   │   ├── Dashboard.jsx  # Gráficos y feed de auditoría en vivo
│   │   ├── Gestion.jsx    # ABM de personal y cargador CSV masivo
│   │   ├── Campanas.jsx   # Banco de plantillas e inicio de campañas reales
│   │   └── Quiz.jsx       # Juego interactivo educativo
│   ├── App.css            # Estilos globales y utilidades de impresión
│   ├── index.css          # Estilos de base
│   └── main.jsx           # Punto de renderizado de React
├── public/                # Recursos públicos estáticos (imágenes, logos)
├── package.json           # Dependencias y scripts de npm
├── nginx.conf             # Servidor de producción en contenedor Docker
└── Dockerfile             # Contenedor multi-etapa
```

---

## ⚙️ Configuración de Entorno (`.env`)

Para apuntar el frontend a tu servidor de backend local o de producción, crea un archivo `.env` en la raíz de `PPS_Frontend/`:

```ini
VITE_API_URL=http://localhost:8000
```

---

## 💻 Instalación y Ejecución Local

### 1. Instalar dependencias
```bash
npm install
```

### 2. Iniciar el Servidor de Desarrollo
```bash
npm run dev
```
Navega a [http://localhost:5173](http://localhost:5173) en tu navegador.

### 3. Compilar para Producción
```bash
npm run build
```
Esto creará el directorio `dist/` conteniendo todos los archivos estáticos HTML/JS/CSS optimizados y listos para ser desplegados en un servidor web como Nginx.

---

## 📄 Descripción de Vistas Principales

1. **Gestión (`Gestion.jsx`):**
   * Pestaña *Personal del Quiz*: Lista y crea usuarios administradores y empleados tradicionales.
   * Pestaña *Destinatarios de Simulación*: Permite agregar colaboradores destinatarios de campañas de simulación, ya sea mediante un formulario o subiendo un archivo CSV (`Nombre,Email,Departamento`) que es parseado en el lado del cliente y subido en bloque.
2. **Campañas (`Campanas.jsx`):**
   * *Banco de Correos*: Biblioteca donde se configuran los escenarios de correo (título, remitente, asunto, HTML, pistas de concientización y nivel de dificultad).
   * *Simulaciones Reales*: Permite crear y lanzar campañas SMTP en tiempo real seleccionando un escenario y enviando correos reales con tokens y enlaces de tracking únicos.
3. **Dashboard (`Dashboard.jsx`):**
   * Procesa estadísticas del backend y las muestra en dos tabs principales (Partidas de Quiz y Simulaciones por Correo).
   * Dibuja el embudo de efectividad de las simulaciones y el porcentaje de riesgo por departamento (CTR departamental) usando gráficos vectoriales interactivos.
   * Contiene un botón para **Exportar Reporte a PDF** que activa el maquetado optimizado de impresión nativo del navegador.
