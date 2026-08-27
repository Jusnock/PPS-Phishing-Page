import sys
import json
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.models import Scenario, Quiz, quiz_scenarios

scenarios_30 = [
    # 1. Microsoft 365 Expiración
    {
        "titulo_interno": "Microsoft 365 - Expiración Inmediata de Contraseña",
        "remitente_nombre": "Microsoft 365 Security Team",
        "remitente_email": "admin@msft-tenant-auth99.com",
        "asunto_simulado": "URGENTE: Su contraseña de Office 365 expira hoy - Conserve su clave",
        "es_phishing": True,
        "dificultad": "MEDIA",
        "explicacion_titulo": "Phishing: Cosecha de Credenciales Microsoft",
        "explicacion_texto": (
            "Microsoft nunca envía correos desde dominios como 'msft-tenant-auth99.com' ni ofrece la opción "
            "de 'mantener la misma contraseña' haciendo clic en un enlace. El botón redirige a un clon falso para capturar usuarios y contraseñas."
        ),
        "clues": [
            {"texto": "Dominio falso del remitente (@msft-tenant-auth99.com) en lugar de @microsoft.com.", "posicion": "top-14 left-6"},
            {"texto": "Sensación de urgencia extrema ('expira hoy') para forzar una acción apresurada.", "posicion": "top-6 right-6"},
            {"texto": "El botón apunta a un dominio temporal no oficial.", "posicion": "bottom-12 center"}
        ],
        "cuerpo_html": """<div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #e1dfdd; border-radius: 6px; padding: 24px; background: #ffffff;">
  <div style="display:flex; align-items:center; border-bottom: 2px solid #0078d4; padding-bottom: 12px; margin-bottom: 16px;">
    <h3 style="color: #0078d4; margin:0; font-size: 18px;">Microsoft 365 Business</h3>
  </div>
  <p style="font-size: 14px; color: #323130;">Estimado usuario corporativo,</p>
  <p style="font-size: 14px; color: #323130; line-height: 1.5;">
    Le informamos que la contraseña asociada a su buzón de correo institucional <strong>expira en el transcurso del día de hoy</strong> conforme a las políticas de rotación periódica.
  </p>
  <div style="background-color: #fff4ce; border-left: 4px solid #ffaa44; padding: 12px; margin: 16px 0; font-size: 13px; color: #323130;">
    Si desea <strong>mantener su contraseña actual</strong> y evitar la interrupción de sus servicios de Outlook y Teams, confirme sus credenciales a continuación.
  </div>
  <div style="text-align: center; margin: 24px 0;">
    <a href="https://auth-m365-renew-session.xyz/login" style="background-color: #0078d4; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 14px; display: inline-block;">Mantener Mi Contraseña Actual</a>
  </div>
  <p style="font-size: 12px; color: #605e5c; border-top: 1px solid #edebe9; padding-top: 12px; margin-top: 20px;">
    Este es un mensaje automatizado del Administrador de Dominio de Microsoft 365.
  </p>
</div>"""
    },

    # 2. Mercado Libre Compra Fake
    {
        "titulo_interno": "Mercado Libre - Compra no reconocida Smart TV",
        "remitente_nombre": "Mercado Libre Notificaciones",
        "remitente_email": "compras@mercadolibre-envios-ar.com",
        "asunto_simulado": "Confirmación de tu compra: Smart TV Samsung 65 UHD 4K ($1.240.000)",
        "es_phishing": True,
        "dificultad": "FACIL",
        "explicacion_titulo": "Phishing: Falsa Alarma de Compra para Robo de Datos",
        "explicacion_texto": (
            "Los atacantes envían notificaciones de compras caras que la víctima no realizó para provocar pánico. "
            "El botón 'Cancelar compra' lleva a una página clonada que pide número de tarjeta y código de seguridad."
        ),
        "clues": [
            {"texto": "El remitente usa un dominio no oficial (@mercadolibre-envios-ar.com) en vez de @mercadolibre.com.ar.", "posicion": "top-14 left-6"},
            {"texto": "El botón 'Cancelar compra' exige ingresar credenciales en una web fraudulenta.", "posicion": "bottom-14 center"}
        ],
        "cuerpo_html": """<div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #e6e6e6; border-radius: 8px; overflow: hidden; background: #ffffff;">
  <div style="background-color: #ffe600; padding: 16px; text-align: left;">
    <h2 style="margin: 0; color: #2d3277; font-size: 20px;">mercado libre</h2>
  </div>
  <div style="padding: 24px;">
    <h3 style="color: #333333; margin-top: 0; font-size: 16px;">¡Gracias por tu compra, Juan!</h3>
    <p style="color: #666666; font-size: 14px;">El vendedor está preparando tu paquete. Tu entrega está programada para mañana.</p>
    <div style="border: 1px solid #eeeeee; border-radius: 6px; padding: 14px; margin: 18px 0; background: #fafafa;">
      <p style="margin: 0 0 8px 0; font-weight: bold; font-size: 14px;">Smart TV Samsung 65 Pulgadas Crystal UHD 4K</p>
      <p style="margin: 0; color: #00a650; font-weight: bold; font-size: 18px;">$ 1.240.000,00</p>
      <p style="margin: 4px 0 0 0; color: #888888; font-size: 12px;">Pagado con Tarjeta de Crédito terminada en 4108</p>
    </div>
    <p style="color: #d93025; font-size: 13px; font-weight: bold;">¿No reconoces esta operación?</p>
    <div style="text-align: center; margin: 20px 0;">
      <a href="https://cancelar-compra-segura-meli.info/soporte" style="background-color: #3483fa; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">Cancelar Compra y Solicitar Reembolso</a>
    </div>
  </div>
</div>"""
    },

    # 3. AFIP / ARCA Cédula Judicial
    {
        "titulo_interno": "AFIP/ARCA - Notificación de Sumario Fiscal",
        "remitente_nombre": "ARCA - Notificaciones Fiscales",
        "remitente_email": "notificaciones@afip-resoluciones-gob.org",
        "asunto_simulado": "NOTIFICACION JUDICIAL ELECTRONICA: Apertura de Sumario Fiscal e Inhibición",
        "es_phishing": True,
        "dificultad": "MEDIA",
        "explicacion_titulo": "Phishing: Suplantación de Ente Recaudador (AFIP/ARCA)",
        "explicacion_texto": (
            "Los organismos fiscales en Argentina sólo notifican formalmente a través del Domicilio Fiscal Electrónico con Clave Fiscal dentro del portal oficial afip.gob.ar. "
            "Nunca envían adjuntos comprimidos (.zip/.rar) ni enlaces directos de descarga fuera del portal .gob.ar."
        ),
        "clues": [
            {"texto": "Dominio falso con extensión .org en lugar de la oficial .gob.ar.", "posicion": "top-14 left-6"},
            {"texto": "AFIP nunca envía intimaciones directas con enlaces externos de descarga de sumarios.", "posicion": "top-8 right-6"}
        ],
        "cuerpo_html": """<div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 2px solid #005691; border-radius: 4px; padding: 20px; background: #ffffff;">
  <div style="border-bottom: 1px solid #005691; padding-bottom: 10px; margin-bottom: 16px;">
    <h2 style="color: #005691; margin: 0; font-size: 18px;">AGENCIA DE RECAUDACIÓN Y CONTROL ADUANERO (ARCA)</h2>
    <p style="color: #666; font-size: 11px; margin: 4px 0 0 0;">Ex AFIP - Sistema de Comunicación Fiscal Electrónica</p>
  </div>
  <p style="font-size: 13px; color: #222;">Señor/a Contribuyente,</p>
  <p style="font-size: 13px; color: #222; line-height: 1.5;">
    Se le notifica formalmente que se ha dictado el auto de apertura del <strong>Sumario Administrativo N° 88492/2026</strong> por inconsistencias no justificadas en las declaraciones juradas del período fiscal anterior.
  </p>
  <div style="background-color: #fde8e8; border: 1px solid #f8b4b4; padding: 10px; border-radius: 4px; font-size: 12px; color: #9b1c1c; margin: 15px 0;">
    <strong>Plazo perentorio:</strong> Dispone de 48 horas hábiles para presentar el descargo antes de la traba de medidas cautelares sobre sus cuentas bancarias.
  </div>
  <div style="text-align: center; margin: 20px 0;">
    <a href="https://descarga-cedula-arca.ddns.net/sumario_88492.pdf.exe" style="background-color: #005691; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 13px; display: inline-block;">Descargar Cédula de Notificación Completa (PDF)</a>
  </div>
</div>"""
    },

    # 4. Google Drive Almacenamiento
    {
        "titulo_interno": "Google Drive - Almacenamiento al 98%",
        "remitente_nombre": "Google Workspace Storage",
        "remitente_email": "storage-noreply@google-workspace-drive-alerts.com",
        "asunto_simulado": "Tu almacenamiento de Google Drive y Gmail está casi lleno (98%)",
        "es_phishing": True,
        "dificultad": "MEDIA",
        "explicacion_titulo": "Phishing: Suplantación de Google Workspace",
        "explicacion_texto": (
            "El remitente utiliza un dominio no oficial. El enlace busca robar las credenciales de la cuenta corporativa de Google."
        ),
        "clues": [
            {"texto": "El dominio de correo contiene palabras añadidas fraudulentas (@google-workspace-drive-alerts.com).", "posicion": "top-14 left-6"}
        ],
        "cuerpo_html": """<div style="font-family: Roboto, Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #dadce0; border-radius: 8px; padding: 24px; background: #fff;">
  <div style="text-align: left; margin-bottom: 20px;">
    <span style="color: #4285f4; font-size: 20px; font-weight: bold;">Google</span> <span style="color: #5f6368; font-size: 16px;">Drive</span>
  </div>
  <p style="color: #202124; font-size: 14px;">Hola,</p>
  <p style="color: #3c4043; font-size: 14px; line-height: 1.5;">
    Has utilizado <strong>14.7 GB de tus 15 GB (98%)</strong>. Cuando te quedes sin espacio, no podrás enviar ni recibir correos electrónicos en Gmail ni sincronizar archivos nuevos en Google Drive.
  </p>
  <div style="background-color: #f1f3f4; border-radius: 4px; height: 10px; width: 100%; margin: 15px 0; overflow: hidden;">
    <div style="background-color: #d93025; height: 10px; width: 98%;"></div>
  </div>
  <p style="color: #3c4043; font-size: 13px;">Como cortesía institucional, puedes solicitar 50 GB adicionales sin costo durante 6 meses.</p>
  <div style="text-align: center; margin: 25px 0;">
    <a href="https://drive-storage-expand-google.online/auth" style="background-color: #1a73e8; color: white; padding: 10px 24px; text-decoration: none; border-radius: 4px; font-weight: 500; font-size: 14px; display: inline-block;">Activar Almacenamiento Gratuito</a>
  </div>
</div>"""
    },

    # 5. Mercado Pago Transferencia (Legítimo)
    {
        "titulo_interno": "Mercado Pago - Comprobante de Transferencia Recibida",
        "remitente_nombre": "Mercado Pago",
        "remitente_email": "info@mercadopago.com.ar",
        "asunto_simulado": "Te transfirieron $ 45.000 a tu cuenta de Mercado Pago",
        "es_phishing": False,
        "dificultad": "MEDIA",
        "explicacion_titulo": "Correo Legítimo: Notificación Transaccional Oficial",
        "explicacion_texto": (
            "El correo proviene del dominio oficial @mercadopago.com.ar. No solicita contraseñas ni contiene enlaces urgentes a webs externas sospechosas."
        ),
        "clues": [
            {"texto": "Remitente verificado desde el dominio oficial de Mercado Pago (@mercadopago.com.ar).", "posicion": "top-14 left-6"},
            {"texto": "Es un correo meramente informativo sin solicitud de claves ni tokens.", "posicion": "bottom-10 center"}
        ],
        "cuerpo_html": """<div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; background: #ffffff;">
  <div style="background-color: #009ee3; padding: 18px 24px;">
    <h2 style="color: white; margin: 0; font-size: 18px;">Mercado Pago</h2>
  </div>
  <div style="padding: 24px;">
    <p style="color: #00a650; font-size: 20px; font-weight: bold; margin: 0 0 8px 0;">¡Recibiste una transferencia!</p>
    <p style="color: #333; font-size: 14px; margin: 0 0 16px 0;"><strong>Estudio Contable Mendocino S.A.</strong> te envió dinero.</p>
    <div style="background-color: #f7f7f7; border-radius: 6px; padding: 16px; margin-bottom: 20px;">
      <table style="width: 100%; font-size: 13px; color: #444;">
        <tr><td style="padding: 4px 0;"><strong>Monto:</strong></td><td style="text-align: right; color: #00a650; font-size: 16px; font-weight: bold;">$ 45.000,00</td></tr>
        <tr><td style="padding: 4px 0;"><strong>Motivo:</strong></td><td style="text-align: right;">Honorarios Profesionales</td></tr>
        <tr><td style="padding: 4px 0;"><strong>Operación N°:</strong></td><td style="text-align: right; font-family: monospace;">8294719203</td></tr>
      </table>
    </div>
    <p style="color: #666; font-size: 12px;">Puedes ver el dinero reflejado en tu cuenta ingresando directamente a la app oficial.</p>
  </div>
</div>"""
    },

    # 6. DocuSign Firma NDA (Phishing ALTA)
    {
        "titulo_interno": "DocuSign - Firma de Acuerdo de Confidencialidad",
        "remitente_nombre": "DocuSign Signature Service",
        "remitente_email": "docusign-envelope@docusign-verify-portal.net",
        "asunto_simulado": "Firma requerida: 'Acuerdo de Confidencialidad y Seguridad 2026.pdf'",
        "es_phishing": True,
        "dificultad": "ALTA",
        "explicacion_titulo": "Phishing Sofisticado: Suplantación de DocuSign",
        "explicacion_texto": (
            "DocuSign legítimo siempre envía desde @docusign.net o @docusign.com. El dominio @docusign-verify-portal.net es fraudulento y clona la plataforma de firma para capturar credenciales de acceso institucional."
        ),
        "clues": [
            {"texto": "Dominio de remitente engañoso (@docusign-verify-portal.net).", "posicion": "top-14 left-6"},
            {"texto": "El botón de revisión apunta a un servidor externo no autorizado.", "posicion": "bottom-14 center"}
        ],
        "cuerpo_html": """<div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #d1d5db; border-radius: 6px; padding: 24px; background: #ffffff;">
  <div style="border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 16px;">
    <span style="font-weight: bold; color: #1e3a8a; font-size: 18px;">DocuSign</span>
  </div>
  <p style="font-size: 14px; color: #1f2937;"><strong>Dirección General de Auditoría</strong> le ha enviado un documento para su firma electrónica:</p>
  <div style="border-left: 4px solid #2563eb; background: #eff6ff; padding: 12px; margin: 16px 0; font-size: 13px;">
    <strong>Documento:</strong> NDA_Auditoria_Seguridad_2026.pdf<br>
    <strong>Estado:</strong> Pendiente de su firma obligatoria
  </div>
  <div style="text-align: center; margin: 24px 0;">
    <a href="https://secure-docusign-review-docs.com/sign" style="background-color: #2563eb; color: white; padding: 12px 28px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px; display: inline-block;">REVISAR Y FIRMAR DOCUMENTO</a>
  </div>
  <p style="font-size: 11px; color: #6b7280; text-align: center;">No comparta este correo con terceros. DocuSign respeta su privacidad.</p>
</div>"""
    },

    # 7. Banco Galicia Suspensión Token
    {
        "titulo_interno": "Banco Galicia - Token Suspendido",
        "remitente_nombre": "Seguridad Galicia Online",
        "remitente_email": "seguridad@galicia-banco-alertas.com",
        "asunto_simulado": "URGENTE: Su Token Galicia ha sido suspendido por inactividad",
        "es_phishing": True,
        "dificultad": "FACIL",
        "explicacion_titulo": "Phishing Bancario Tradicional",
        "explicacion_texto": (
            "Las entidades bancarias nunca solicitan activar el Token ni ingresar claves por correo electrónico. El dominio es apócrifo."
        ),
        "clues": [
            {"texto": "Dominio falso (@galicia-banco-alertas.com) en lugar de @bancogalicia.com.ar.", "posicion": "top-14 left-6"}
        ],
        "cuerpo_html": """<div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 6px; padding: 20px; background: #fff;">
  <div style="background-color: #e65100; color: white; padding: 12px 18px; border-radius: 4px; margin-bottom: 16px;">
    <h3 style="margin: 0; font-size: 16px;">Banco Galicia • Seguridad Operativa</h3>
  </div>
  <p style="font-size: 13px; color: #374151;">Estimado cliente,</p>
  <p style="font-size: 13px; color: #374151; line-height: 1.5;">
    Detectamos que su clave de seguridad <strong>Token Galicia</strong> requiere una sincronización preventiva obligatoria para continuar realizando transferencias bancarias y pago de haberes.
  </p>
  <div style="text-align: center; margin: 22px 0;">
    <a href="https://bancogalicia-reactivar-token.online" style="background-color: #e65100; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px; display: inline-block;">Reactivar Token Ahora</a>
  </div>
</div>"""
    },

    # 8. WhatsApp Web Vinculación
    {
        "titulo_interno": "WhatsApp - Nueva vinculación de dispositivo",
        "remitente_nombre": "WhatsApp Security Alert",
        "remitente_email": "web-auth@whatsapp-devices-sync.net",
        "asunto_simulado": "Alerta: Se vinculó una nueva sesión de WhatsApp Web en Safari (Windows 11)",
        "es_phishing": True,
        "dificultad": "MEDIA",
        "explicacion_titulo": "Phishing: Falsa Alerta de Seguridad de WhatsApp",
        "explicacion_texto": (
            "WhatsApp no envía correos alertando sobre sesiones web a menos que tengas el servicio configurado con cuentas de empresa verified, y nunca desde dominios de terceros (.net)."
        ),
        "clues": [
            {"texto": "WhatsApp nunca utiliza correos con dominios .net no oficiales.", "posicion": "top-14 left-6"}
        ],
        "cuerpo_html": """<div style="font-family: Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #d1fae5; border-radius: 8px; padding: 24px; background: #ffffff;">
  <div style="background-color: #25d366; color: white; padding: 12px 18px; border-radius: 6px; margin-bottom: 18px;">
    <h3 style="margin: 0; font-size: 16px;">WhatsApp Web Security</h3>
  </div>
  <p style="font-size: 14px; color: #111827;">Se ha iniciado una nueva sesión de WhatsApp Web en su cuenta vinculada.</p>
  <div style="background: #f3f4f6; padding: 12px; border-radius: 6px; font-size: 12px; color: #374151; margin: 16px 0;">
    <strong>Ubicación:</strong> Córdoba, Argentina (IP: 181.164.20.9)<br>
    <strong>Navegador:</strong> Chrome / Windows 11
  </div>
  <p style="font-size: 13px; color: #dc2626; font-weight: bold;">¿No reconoces esta actividad? Cierra la sesión inmediatamente:</p>
  <div style="text-align: center; margin: 20px 0;">
    <a href="https://whatsapp-desvincular-dispositivo.xyz" style="background-color: #dc2626; color: white; padding: 10px 22px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block;">Desvincular Dispositivo y Proteger Cuenta</a>
  </div>
</div>"""
    },

    # 9. Slack Invitación Legítima
    {
        "titulo_interno": "Slack - Invitación a Espacio de Trabajo",
        "remitente_nombre": "Slack Notifications",
        "remitente_email": "notification@slack.com",
        "asunto_simulado": "Juan Vazquez te invitó a unirte al espacio de trabajo 'CPCE Innovación TI'",
        "es_phishing": False,
        "dificultad": "MEDIA",
        "explicacion_titulo": "Correo Legítimo: Invitación Oficial de Slack",
        "explicacion_texto": (
            "El correo proviene de @slack.com, el botón redirige al dominio oficial https://slack.com y cuenta con cabeceras de autenticación DKIM/SPF legítimas."
        ),
        "clues": [
            {"texto": "Remitente auténtico desde el dominio oficial @slack.com.", "posicion": "top-14 left-6"}
        ],
        "cuerpo_html": """<div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; background: #ffffff;">
  <div style="margin-bottom: 20px;">
    <h2 style="color: #4a154b; margin: 0; font-size: 22px; font-weight: bold;">slack</h2>
  </div>
  <p style="font-size: 14px; color: #1e293b;">Hola,</p>
  <p style="font-size: 14px; color: #1e293b; line-height: 1.5;">
    <strong>Juan Vazquez</strong> te ha invitado a colaborar en el espacio de trabajo <strong>CPCE Innovación TI</strong> en Slack.
  </p>
  <div style="text-align: center; margin: 24px 0;">
    <a href="https://cpcemza.slack.com/signup" style="background-color: #007a5a; color: white; padding: 12px 28px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px; display: inline-block;">Unirse a CPCE en Slack</a>
  </div>
</div>"""
    },

    # 10. Recursos Humanos Recibo de Sueldo Fake
    {
        "titulo_interno": "RRHH - Recibo de Sueldo y Liquidación Extraordinaria",
        "remitente_nombre": "Departamento de Recursos Humanos",
        "remitente_email": "rrhh-recibos@portal-gestion-nomina.com",
        "asunto_simulado": "CONFIDENCIAL: Liquidación de Haberes y Bono Extraordinario Agosto 2026",
        "es_phishing": True,
        "dificultad": "ALTA",
        "explicacion_titulo": "Phishing de Ingeniería Social: Suplantación de RRHH",
        "explicacion_texto": (
            "Los atacantes usan el tema de sueldos y bonos para tentar al usuario a abrir un archivo o ingresar claves en un sitio externo."
        ),
        "clues": [
            {"texto": "El remitente usa un dominio genérico no perteneciente a la institución.", "posicion": "top-14 left-6"}
        ],
        "cuerpo_html": """<div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 6px; padding: 22px; background: #fff;">
  <h3 style="color: #0f172a; margin-top: 0; border-bottom: 2px solid #004a98; padding-bottom: 8px;">Portal de Autogestión de Recursos Humanos</h3>
  <p style="font-size: 13px; color: #334155;">Estimado/a colaborador/a,</p>
  <p style="font-size: 13px; color: #334155; line-height: 1.5;">
    Se encuentra disponible para su firma y conformidad el <strong>Recibo de Haberes correspondiente al período en curso</strong>, incluyendo la acreditación del bono extraordinario no remunerativo.
  </p>
  <div style="text-align: center; margin: 22px 0;">
    <a href="https://portal-recibos-firmas.com/login" style="background-color: #004a98; color: white; padding: 10px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 13px; display: inline-block;">Ver y Firmar Mi Recibo de Sueldo</a>
  </div>
</div>"""
    },

    # 11. Zoom Grabación Disponible
    {
        "titulo_interno": "Zoom - Grabación de Reunión de Directorio",
        "remitente_nombre": "Zoom Cloud Recordings",
        "remitente_email": "recordings@zoom-cloud-share.net",
        "asunto_simulado": "Grabación en la nube disponible: Reunión Extraordinaria de Directorio y Finanzas",
        "es_phishing": True,
        "dificultad": "MEDIA",
        "explicacion_titulo": "Phishing: Falsa Grabación de Zoom",
        "explicacion_texto": "Zoom envía notificaciones oficiales desde @zoom.us. Los dominios con guiones como zoom-cloud-share.net son maliciosos.",
        "clues": [{"texto": "Dominio ilegítimo (@zoom-cloud-share.net).", "posicion": "top-14 left-6"}],
        "cuerpo_html": """<div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 6px; padding: 24px; background: #fff;">
  <h2 style="color: #2d8cff; margin: 0 0 16px 0; font-size: 20px;">zoom</h2>
  <p style="font-size: 14px; color: #334155;">Hola,</p>
  <p style="font-size: 14px; color: #334155;">La grabación de la reunión <strong>'Reunión Extraordinaria de Directorio y Finanzas'</strong> ya está lista para su visualización y descarga.</p>
  <div style="text-align: center; margin: 24px 0;">
    <a href="https://zoom-us-view-recording.online/play" style="background-color: #2d8cff; color: white; padding: 10px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 13px; display: inline-block;">Reproducir Grabación en la Nube</a>
  </div>
</div>"""
    },

    # 12. Correo Argentino Paquete Retenido
    {
        "titulo_interno": "Correo Argentino - Paquete Retenido por Tasas",
        "remitente_nombre": "Correo Argentino Envíos",
        "remitente_email": "trazabilidad@correoargentino-gestion-ar.com",
        "asunto_simulado": "Aviso de Entrega: Su envío internacional está retenido en sucursal",
        "es_phishing": True,
        "dificultad": "FACIL",
        "explicacion_titulo": "Phishing: Falso Paquete de Correo Argentino",
        "explicacion_texto": "El dominio oficial es correoargentino.com.ar. El botón exige pago de una tasa falsa mediante tarjeta de crédito.",
        "clues": [{"texto": "Dominio apócrifo (@correoargentino-gestion-ar.com).", "posicion": "top-14 left-6"}],
        "cuerpo_html": """<div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; background: #fff;">
  <div style="background-color: #003882; color: #ffcc00; padding: 12px; font-weight: bold; font-size: 16px; margin-bottom: 16px;">
    CORREO ARGENTINO
  </div>
  <p style="font-size: 13px; color: #333;">Estimado cliente,</p>
  <p style="font-size: 13px; color: #333;">Su paquete con número de seguimiento <strong>AR-99381-02</strong> se encuentra retenido por una tasa aduanera pendiente de $ 2.850,00.</p>
  <div style="text-align: center; margin: 20px 0;">
    <a href="https://correo-ar-pagos-tasa.info" style="background-color: #ffcc00; color: #003882; padding: 10px 22px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 13px; display: inline-block;">Pagar Tasa de Liberación</a>
  </div>
</div>"""
    },

    # 13. LinkedIn Conexión (Legítimo)
    {
        "titulo_interno": "LinkedIn - Nueva solicitud de contacto profesional",
        "remitente_nombre": "LinkedIn",
        "remitente_email": "messages-noreply@linkedin.com",
        "asunto_simulado": "Mariana Gómez quiere conectar contigo en LinkedIn",
        "es_phishing": False,
        "dificultad": "FACIL",
        "explicacion_titulo": "Correo Legítimo: Notificación de LinkedIn",
        "explicacion_texto": "Proviene de @linkedin.com y los enlaces apuntan directamente a la red social oficial.",
        "clues": [{"texto": "Dominio verificado @linkedin.com.", "posicion": "top-14 left-6"}],
        "cuerpo_html": """<div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 6px; padding: 24px; background: #fff;">
  <span style="color: #0a66c2; font-size: 20px; font-weight: bold;">Linked<span style="background: #0a66c2; color: white; padding: 0 4px; border-radius: 2px;">in</span></span>
  <p style="font-size: 14px; color: #1e293b; margin-top: 16px;"><strong>Mariana Gómez</strong> (Directora de Auditoría en Consultora Global) desea sumarte a su red.</p>
  <div style="text-align: center; margin: 20px 0;">
    <a href="https://www.linkedin.com/in/invite" style="background-color: #0a66c2; color: white; padding: 10px 22px; text-decoration: none; border-radius: 20px; font-weight: bold; font-size: 13px; display: inline-block;">Aceptar Solicitud</a>
  </div>
</div>"""
    },

    # 14. WeTransfer Archivos Confidenciales (Phishing ALTA)
    {
        "titulo_interno": "WeTransfer - Archivos de Auditoría Q3.zip",
        "remitente_nombre": "WeTransfer Transfer",
        "remitente_email": "noreply@wetransfer-file-cloud.com",
        "asunto_simulado": "auditoria_interna_cpce_2026.zip te ha sido enviado vía WeTransfer",
        "es_phishing": True,
        "dificultad": "ALTA",
        "explicacion_titulo": "Phishing: Clon de WeTransfer para Entrega de Malware",
        "explicacion_texto": "El dominio oficial de WeTransfer es wetransfer.com. Este enlace descarga un archivo malicioso camuflado.",
        "clues": [{"texto": "Dominio apócrifo (@wetransfer-file-cloud.com).", "posicion": "top-14 left-6"}],
        "cuerpo_html": """<div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; background: #fbfbfb;">
  <h2 style="color: #111; margin: 0 0 16px 0;">WeTransfer</h2>
  <p style="font-size: 14px; color: #333;"><strong>gerencia@auditoria.com</strong> te envió 2 archivos (24.8 MB en total).</p>
  <p style="font-size: 12px; color: #666;">Archivos disponibles durante 7 días: 'auditoria_interna_cpce_2026.zip'</p>
  <div style="text-align: center; margin: 24px 0;">
    <a href="https://wetransfer-file-download.info/get" style="background-color: #409fff; color: white; padding: 12px 28px; text-decoration: none; border-radius: 24px; font-weight: bold; font-size: 14px; display: inline-block;">Descargar Archivos</a>
  </div>
</div>"""
    },

    # 15. Netflix Pago Rechazado
    {
        "titulo_interno": "Netflix - Suspensión de Membresía por Facturación",
        "remitente_nombre": "Netflix Soporte",
        "remitente_email": "billing-alert@netflix-customers-update.net",
        "asunto_simulado": "Aviso importante: No pudimos procesar el cobro de tu suscripción mensual",
        "es_phishing": True,
        "dificultad": "FACIL",
        "explicacion_titulo": "Phishing Masivo: Robo de Tarjetas de Crédito",
        "explicacion_texto": "El remitente usa un dominio ajeno a netflix.com para capturar datos de pago.",
        "clues": [{"texto": "Dominio falso (@netflix-customers-update.net).", "posicion": "top-14 left-6"}],
        "cuerpo_html": """<div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; background: #141414; color: #fff; padding: 24px; border-radius: 6px;">
  <h1 style="color: #e50914; margin: 0 0 16px 0; font-size: 24px;">NETFLIX</h1>
  <p style="font-size: 14px; color: #e5e5e5;">No pudimos renovar tu suscripción con tu tarjeta actual.</p>
  <p style="font-size: 13px; color: #999;">Actualiza tu información de pago para continuar viendo tus series y películas sin interrupciones.</p>
  <div style="text-align: center; margin: 24px 0;">
    <a href="https://netflix-actualizar-membresia.xyz" style="background-color: #e50914; color: white; padding: 12px 28px; text-decoration: none; border-radius: 2px; font-weight: bold; font-size: 14px; display: inline-block;">ACTUALIZAR CUENTA</a>
  </div>
</div>"""
    },

    # 16. Mesa de Ayuda TI Antivirus Update
    {
        "titulo_interno": "Soporte TI - Parche Crítico de Seguridad Windows",
        "remitente_nombre": "Mesa de Ayuda TI",
        "remitente_email": "soporte-ti@cpcemza-it-helpdesk.com",
        "asunto_simulado": "URGENTE: Instalación obligatoria del parche de seguridad VPN v4.2",
        "es_phishing": True,
        "dificultad": "ALTA",
        "explicacion_titulo": "Spear Phishing Interno: Falso Instalador de TI",
        "explicacion_texto": "El equipo de TI nunca envía ejecutables adjuntos ni enlaces de descarga de parches desde dominios no corporativos.",
        "clues": [{"texto": "Dominio externo simulando ser soporte interno (@cpcemza-it-helpdesk.com).", "posicion": "top-14 left-6"}],
        "cuerpo_html": """<div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 6px; padding: 22px; background: #fff;">
  <h3 style="color: #0f172a; margin-top: 0;">Soporte de Infraestructura y Redes</h3>
  <p style="font-size: 13px; color: #334155;">Estimados colaboradores,</p>
  <p style="font-size: 13px; color: #334155;">Por motivos de ciberseguridad, es obligatorio descargar y ejecutar la actualización del cliente de VPN institucional antes de las 18:00 hs.</p>
  <div style="text-align: center; margin: 20px 0;">
    <a href="https://cpcemza-it-helpdesk.com/update_vpn.exe" style="background-color: #004a98; color: white; padding: 10px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 13px; display: inline-block;">Descargar e Instalar Parche</a>
  </div>
</div>"""
    },

    # 17. Dropbox Carpeta Compartida
    {
        "titulo_interno": "Dropbox - Carpeta de Presupuestos Compartida",
        "remitente_nombre": "Dropbox Cloud Notifications",
        "remitente_email": "share@dropbox-team-cloud.org",
        "asunto_simulado": "Carlos Perez compartió la carpeta 'Presupuestos y Balances 2026' contigo",
        "es_phishing": True,
        "dificultad": "MEDIA",
        "explicacion_titulo": "Phishing: Falsa Carpeta Compartida",
        "explicacion_texto": "El correo simula ser Dropbox pero usa el dominio dropbox-team-cloud.org para robar claves de acceso.",
        "clues": [{"texto": "Dominio falso con extensión .org.", "posicion": "top-14 left-6"}],
        "cuerpo_html": """<div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 6px; padding: 24px; background: #fff;">
  <h2 style="color: #0061fe; margin: 0 0 16px 0;">Dropbox</h2>
  <p style="font-size: 14px; color: #333;"><strong>Carlos Perez</strong> ha compartido una carpeta protegida contigo en Dropbox.</p>
  <div style="text-align: center; margin: 22px 0;">
    <a href="https://dropbox-view-shared-folder.net" style="background-color: #0061fe; color: white; padding: 10px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 13px; display: inline-block;">Ir a la carpeta</a>
  </div>
</div>"""
    },

    # 18. GitHub Pull Request (Legítimo)
    {
        "titulo_interno": "GitHub - Asignación de Review en Pull Request",
        "remitente_nombre": "GitHub",
        "remitente_email": "notifications@github.com",
        "asunto_simulado": "[GitHub] Jusnock requested your review on PPS-Phishing-Page#14",
        "es_phishing": False,
        "dificultad": "MEDIA",
        "explicacion_titulo": "Correo Legítimo: Notificación de GitHub",
        "explicacion_texto": "Proviene de @github.com y los enlaces apuntan directamente al repositorio oficial sin redirecciones sospechosas.",
        "clues": [{"texto": "Dominio oficial @github.com y firma criptográfica válida.", "posicion": "top-14 left-6"}],
        "cuerpo_html": """<div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #d0d7de; border-radius: 6px; padding: 24px; background: #fff;">
  <h3 style="margin-top: 0; color: #24292f;">GitHub</h3>
  <p style="font-size: 13px; color: #57606a;"><strong>Jusnock</strong> requested your review on: <strong>PPS-Phishing-Page #14 (Feature: Dashboard metrics)</strong>.</p>
  <div style="text-align: center; margin: 20px 0;">
    <a href="https://github.com/Jusnock/PPS-Phishing-Page/pull/14" style="background-color: #2da44e; color: white; padding: 8px 18px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 13px; display: inline-block;">View Pull Request</a>
  </div>
</div>"""
    },

    # 19. Telecom Personal Factura Corte
    {
        "titulo_interno": "Personal Flow - Aviso de Suspensión de Internet",
        "remitente_nombre": "Personal Flow Facturación",
        "remitente_email": "cobranzas@telecom-personal-aviso.com",
        "asunto_simulado": "Aviso de corte de servicio por factura impaga - Vence hoy",
        "es_phishing": True,
        "dificultad": "MEDIA",
        "explicacion_titulo": "Phishing: Amenaza de Corte de Servicio",
        "explicacion_texto": "Los estafadores se hacen pasar por la empresa de telecomunicaciones para forzar un pago en una pasarela fraudulenta.",
        "clues": [{"texto": "Dominio falso @telecom-personal-aviso.com.", "posicion": "top-14 left-6"}],
        "cuerpo_html": """<div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 6px; padding: 22px; background: #fff;">
  <h2 style="color: #002d72; margin: 0 0 16px 0;">Personal Flow</h2>
  <p style="font-size: 13px; color: #333;">Le informamos que registra una factura vencida por $ 18.400. Evite la suspensión del servicio abonando en línea.</p>
  <div style="text-align: center; margin: 20px 0;">
    <a href="https://pago-facturas-personal-flow.com" style="background-color: #00a9e0; color: white; padding: 10px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 13px; display: inline-block;">Pagar Factura Online</a>
  </div>
</div>"""
    },

    # 20. Canva Diseño Compartido (Legítimo)
    {
        "titulo_interno": "Canva - Diseño de Presentación Compartido",
        "remitente_nombre": "Canva",
        "remitente_email": "notifications@canva.com",
        "asunto_simulado": "Luciana compartió un diseño contigo: 'Balance Anual CPCE 2026'",
        "es_phishing": False,
        "dificultad": "FACIL",
        "explicacion_titulo": "Correo Legítimo: Notificación de Canva",
        "explicacion_texto": "Proviene de @canva.com y redirige a la plataforma oficial de diseño.",
        "clues": [{"texto": "Dominio oficial @canva.com.", "posicion": "top-14 left-6"}],
        "cuerpo_html": """<div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; background: #fff;">
  <h2 style="color: #7d2ae8; margin: 0 0 14px 0;">Canva</h2>
  <p style="font-size: 14px; color: #1e293b;"><strong>Luciana</strong> te invitó a editar el diseño <strong>'Balance Anual CPCE 2026'</strong>.</p>
  <div style="text-align: center; margin: 20px 0;">
    <a href="https://www.canva.com/design" style="background-color: #7d2ae8; color: white; padding: 10px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 13px; display: inline-block;">Abrir en Canva</a>
  </div>
</div>"""
    },

    # 21. CEO Fraud / BEC Pago Urgente (Phishing ALTA)
    {
        "titulo_interno": "Presidencia / CEO - Transferencia Urgente Confidencial",
        "remitente_nombre": "Presidente del Consejo",
        "remitente_email": "presidencia.ejecutiva.cpce@gmail.com",
        "asunto_simulado": "URGENTE Y CONFIDENCIAL: Pago inmediato de anticipo a nuevo proveedor",
        "es_phishing": True,
        "dificultad": "ALTA",
        "explicacion_titulo": "Ataque BEC (Business Email Compromise / Fraude del CEO)",
        "explicacion_texto": "El atacante suplanta al presidente de la entidad usando una cuenta pública gratuita de Gmail y solicita un pago bancario confidencial sin pasar por los circuitos de control habituales.",
        "clues": [
            {"texto": "La autoridad máxima institucional nunca utiliza una cuenta personal @gmail.com para ordenar transferencias bancarias.", "posicion": "top-14 left-6"},
            {"texto": "Petición de extrema confidencialidad para evitar que consultes con tus compañeros.", "posicion": "top-8 right-6"}
        ],
        "cuerpo_html": """<div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 20px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px;">
  <p style="font-size: 14px; color: #111827;">Hola Juan,</p>
  <p style="font-size: 14px; color: #111827; line-height: 1.5;">
    Estoy en una reunión de directorio reservada y necesito que realices una transferencia bancaria prioritaria por $ 2.400.000 para señar los nuevos servidores institucionales.
  </p>
  <p style="font-size: 14px; color: #111827;">
    Por favor no lo comentes con el resto de la oficina todavía. Respóndeme a este correo para pasarte el CBU del proveedor y los datos de facturación.
  </p>
  <p style="font-size: 13px; color: #4b5563; margin-top: 24px;">Enviado desde mi iPhone</p>
</div>"""
    },

    # 22. AWS Presupuesto (Legítimo)
    {
        "titulo_interno": "AWS - Alerta de Presupuesto Mensual",
        "remitente_nombre": "Amazon Web Services",
        "remitente_email": "no-reply-aws@amazon.com",
        "asunto_simulado": "AWS Budget Alert: PPS-Server-Production has exceeded 80% of budgeted amount",
        "es_phishing": False,
        "dificultad": "MEDIA",
        "explicacion_titulo": "Correo Legítimo: Notificación de Facturación Cloud AWS",
        "explicacion_texto": "Proviene de @amazon.com con firmas SPF/DKIM oficiales.",
        "clues": [{"texto": "Dominio oficial @amazon.com.", "posicion": "top-14 left-6"}],
        "cuerpo_html": """<div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #d5dbdb; border-radius: 4px; padding: 24px; background: #fff;">
  <h3 style="color: #232f3e; margin-top: 0;">Amazon Web Services</h3>
  <p style="font-size: 13px; color: #16191f;">Your budget 'PPS-Server-Production' exceeded the 80% threshold ($80.00 / $100.00 USD).</p>
  <div style="text-align: center; margin: 20px 0;">
    <a href="https://console.aws.amazon.com/billing" style="background-color: #ff9900; color: #111; padding: 8px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 13px; display: inline-block;">View AWS Console</a>
  </div>
</div>"""
    },

    # 23. Spotify Renovación (Legítimo)
    {
        "titulo_interno": "Spotify - Confirmación de Recibo de Suscripción",
        "remitente_nombre": "Spotify",
        "remitente_email": "no-reply@spotify.com",
        "asunto_simulado": "Recibo de tu suscripción a Spotify Premium Familiar",
        "es_phishing": False,
        "dificultad": "FACIL",
        "explicacion_titulo": "Correo Legítimo: Recibo Oficial Spotify",
        "explicacion_texto": "Correo oficial de facturación sin peticiones de claves.",
        "clues": [{"texto": "Dominio oficial @spotify.com.", "posicion": "top-14 left-6"}],
        "cuerpo_html": """<div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 6px; padding: 24px; background: #121212; color: #fff;">
  <h2 style="color: #1ed760; margin: 0 0 16px 0;">Spotify</h2>
  <p style="font-size: 14px;">Hemos procesado el cobro de tu plan Spotify Premium Familiar.</p>
  <p style="font-size: 12px; color: #b3b3b3;">Monto: $ 3.499,00 + impuestos • Fecha: Hoy</p>
</div>"""
    },

    # 24. Apple ID Inicio de Sesión Extraño
    {
        "titulo_interno": "Apple Support - Inicio de Sesión en San Petersburgo",
        "remitente_nombre": "Apple Support Security",
        "remitente_email": "service@appleid-security-auth-check.org",
        "asunto_simulado": "Tu Apple ID fue utilizado para iniciar sesión en iCloud desde Rusia",
        "es_phishing": True,
        "dificultad": "MEDIA",
        "explicacion_titulo": "Phishing: Suplantación de Apple ID",
        "explicacion_texto": "El dominio de correo es falso (.org) y el botón de bloqueo pide introducir credenciales y tarjeta.",
        "clues": [{"texto": "Dominio apócrifo @appleid-security-auth-check.org.", "posicion": "top-14 left-6"}],
        "cuerpo_html": """<div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #d1d5db; border-radius: 6px; padding: 24px; background: #fff;">
  <h2 style="color: #333; margin: 0 0 14px 0;">Apple</h2>
  <p style="font-size: 13px; color: #333;">Se ha detectado un inicio de sesión en tu cuenta de Apple ID desde San Petersburgo, Rusia.</p>
  <div style="text-align: center; margin: 20px 0;">
    <a href="https://apple-id-bloquear-sesion.net" style="background-color: #0071e3; color: white; padding: 10px 22px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 13px; display: inline-block;">Bloquear y Proteger Apple ID</a>
  </div>
</div>"""
    },

    # 25. PedidosYa Confirmación (Legítimo)
    {
        "titulo_interno": "PedidosYa - Confirmación de Pedido",
        "remitente_nombre": "PedidosYa",
        "remitente_email": "contacto@pedidosya.com",
        "asunto_simulado": "¡Tu pedido de Empanadas Mendocinas está en camino!",
        "es_phishing": False,
        "dificultad": "FACIL",
        "explicacion_titulo": "Correo Legítimo: Notificación de PedidosYa",
        "explicacion_texto": "Proviene de @pedidosya.com sin enlaces a sitios externos dudosos.",
        "clues": [{"texto": "Dominio oficial @pedidosya.com.", "posicion": "top-14 left-6"}],
        "cuerpo_html": """<div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; background: #fff;">
  <h2 style="color: #ff0046; margin: 0 0 12px 0;">PedidosYa</h2>
  <p style="font-size: 13px; color: #333;">El repartidor está llevando tu pedido a la dirección registrada.</p>
</div>"""
    },

    # 26. Visa / Mastercard Bloqueo
    {
        "titulo_interno": "Visa / Prisma - Consumo Sospechoso en el Exterior",
        "remitente_nombre": "Centro de Prevención de Fraudes Visa",
        "remitente_email": "alertas@visahome-prevencion-fraudes.com",
        "asunto_simulado": "ALERTA PREVENTIVA: Consumo sospechoso en Londres por USD 1,450.00",
        "es_phishing": True,
        "dificultad": "MEDIA",
        "explicacion_titulo": "Phishing: Falso Fraude de Tarjeta de Crédito",
        "explicacion_texto": "El dominio oficial es visa.com.ar o visahome.prisma.com.ar. Este correo busca clonar los 16 dígitos y código de seguridad.",
        "clues": [{"texto": "Dominio no oficial @visahome-prevencion-fraudes.com.", "posicion": "top-14 left-6"}],
        "cuerpo_html": """<div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 6px; padding: 24px; background: #fff;">
  <h2 style="color: #1a1f71; margin: 0 0 14px 0;">VISA</h2>
  <p style="font-size: 13px; color: #333;">Detectamos una compra sospechosa en Apple Store London por USD 1,450.00.</p>
  <div style="text-align: center; margin: 20px 0;">
    <a href="https://visa-verificacion-consumos.com" style="background-color: #1a1f71; color: white; padding: 10px 22px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 13px; display: inline-block;">Desconocer Compra</a>
  </div>
</div>"""
    },

    # 27. Adobe Creative Cloud (Legítimo)
    {
        "titulo_interno": "Adobe Creative Cloud - Renovación de Licencia",
        "remitente_nombre": "Adobe",
        "remitente_email": "message@adobe.com",
        "asunto_simulado": "Tu suscripción a Adobe Creative Cloud se ha renovado con éxito",
        "es_phishing": False,
        "dificultad": "MEDIA",
        "explicacion_titulo": "Correo Legítimo: Notificación de Adobe",
        "explicacion_texto": "Proviene de @adobe.com con enlaces al centro de cuentas oficial de Adobe.",
        "clues": [{"texto": "Dominio oficial @adobe.com.", "posicion": "top-14 left-6"}],
        "cuerpo_html": """<div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 6px; padding: 24px; background: #fff;">
  <h2 style="color: #eb1000; margin: 0 0 14px 0;">Adobe</h2>
  <p style="font-size: 13px; color: #333;">Tu plan de Adobe Creative Cloud continúa activo por un nuevo período.</p>
</div>"""
    },

    # 28. Impresora Multifunción Escaneado (Phishing ALTA)
    {
        "titulo_interno": "Impresora de Red - Documento Escaneado DocScan_0049.pdf.exe",
        "remitente_nombre": "Scanner Institucional HP LaserJet",
        "remitente_email": "scanner-noreply@hp-network-devices-cpce.com",
        "asunto_simulado": "Documento escaneado adjunto desde Impresora Piso 2 (DocScan_0049.pdf)",
        "es_phishing": True,
        "dificultad": "ALTA",
        "explicacion_titulo": "Phishing Técnico: Suplantación de Escáner de Red",
        "explicacion_texto": "Los atacantes suplantan impresoras de red corporativas con enlaces a ejecutables .exe disfrazados de documentos escaneados.",
        "clues": [
            {"texto": "El dominio es externo (@hp-network-devices-cpce.com) en vez del servidor SMTP local.", "posicion": "top-14 left-6"},
            {"texto": "El archivo descargable es un ejecutable malicioso con doble extensión (.pdf.exe).", "posicion": "bottom-12 center"}
        ],
        "cuerpo_html": """<div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; background: #fff;">
  <h3 style="color: #0096d6; margin-top: 0;">HP Digital Network Scanner</h3>
  <p style="font-size: 13px; color: #333;">Se ha recibido un nuevo documento digitalizado en la bandeja central:</p>
  <div style="background: #f8fafc; padding: 10px; border-radius: 4px; font-size: 12px; margin: 12px 0;">
    <strong>Nombre:</strong> DocScan_2026_0827_0049.pdf<br>
    <strong>Páginas:</strong> 4 páginas (Color 300 DPI)
  </div>
  <div style="text-align: center; margin: 20px 0;">
    <a href="https://hp-network-devices-cpce.com/download/DocScan_0049.pdf.exe" style="background-color: #0096d6; color: white; padding: 10px 22px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 13px; display: inline-block;">Descargar Documento Escaneado</a>
  </div>
</div>"""
    },

    # 29. Notaría / Citación Judicial
    {
        "titulo_interno": "Poder Judicial - Notificación de Audiencia Conciliatoria",
        "remitente_nombre": "Notificaciones Judiciales Electrónicas",
        "remitente_email": "cedulas@notificaciones-judiciales-expedientes.net",
        "asunto_simulado": "CITACIÓN JUDICIAL URGENTE: Cédula de Notificación en Autos Caratulados",
        "es_phishing": True,
        "dificultad": "ALTA",
        "explicacion_titulo": "Phishing Jurídico: Falsa Cédula de Notificación",
        "explicacion_texto": "Las cédulas del poder judicial en Argentina se tramitan exclusivamente a través de los portales oficiales .jus.gov.ar o .gov.ar.",
        "clues": [{"texto": "Dominio privado .net en lugar de portal judicial oficial .gov.ar / .jus.gov.ar.", "posicion": "top-14 left-6"}],
        "cuerpo_html": """<div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 2px solid #334155; border-radius: 4px; padding: 22px; background: #fff;">
  <h3 style="color: #1e293b; margin-top: 0; text-transform: uppercase;">Poder Judicial • Oficina de Mandamientos y Notificaciones</h3>
  <p style="font-size: 13px; color: #333;">Por la presente se le notifica que ha sido citado a la audiencia fijada en el expediente N° 4492/2026.</p>
  <div style="text-align: center; margin: 20px 0;">
    <a href="https://descarga-cedula-expediente.org" style="background-color: #1e293b; color: white; padding: 10px 22px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 13px; display: inline-block;">Ver Cédula Oficial y Acta</a>
  </div>
</div>"""
    },

    # 30. CPCE Asamblea Ordinaria (Legítimo)
    {
        "titulo_interno": "CPCE Mendoza - Convocatoria a Asamblea General",
        "remitente_nombre": "Consejo Profesional de Ciencias Económicas",
        "remitente_email": "comunicaciones@cpcemza.org.ar",
        "asunto_simulado": "Convocatoria a Asamblea General Ordinaria y Presentación de Memoria y Balance",
        "es_phishing": False,
        "dificultad": "MEDIA",
        "explicacion_titulo": "Correo Legítimo: Comunicación Oficial CPCE Mendoza",
        "explicacion_texto": "Proviene del dominio institucional oficial @cpcemza.org.ar con enlace directo al portal oficial de matriculados.",
        "clues": [
            {"texto": "Dominio oficial de la institución (@cpcemza.org.ar).", "posicion": "top-14 left-6"},
            {"texto": "El contenido es meramente informativo y de interés profesional sin solicitudes sospechosas de contraseñas.", "posicion": "bottom-10 center"}
        ],
        "cuerpo_html": """<div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; background: #fff;">
  <div style="background-color: #004a98; padding: 18px 24px; color: white;">
    <h2 style="margin: 0; font-size: 18px;">CPCE Mendoza</h2>
    <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.85;">Consejo Profesional de Ciencias Económicas</p>
  </div>
  <div style="padding: 24px;">
    <h3 style="color: #0f172a; margin-top: 0; font-size: 16px;">Estimados y estimadas profesionales matriculados:</h3>
    <p style="font-size: 13px; color: #334155; line-height: 1.6;">
      De acuerdo con las disposiciones estatutarias vigentes, el Consejo Directivo convoca a los matriculados a la <strong>Asamblea General Ordinaria</strong> que se llevará a cabo en la Sede Central.
    </p>
    <div style="background: #eff6ff; border-left: 4px solid #004a98; padding: 12px; margin: 16px 0; font-size: 13px; color: #1e3a8a;">
      <strong>Orden del día:</strong> Consideración de la Memoria, Balance General y Estado de Resultados del Ejercicio.
    </div>
    <div style="text-align: center; margin: 24px 0;">
      <a href="https://cpcemza.org.ar/asamblea" style="background-color: #004a98; color: white; padding: 10px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 13px; display: inline-block;">Consultar Memoria y Orden del Día</a>
    </div>
  </div>
</div>"""
    }
]

def run():
    db = SessionLocal()
    try:
        # 1. Crear / obtener el Quiz General de 30 Casos
        quiz_titulo = "Quiz Integral de Concientización (30 Casos Reales)"
        quiz = db.query(Quiz).filter(Quiz.titulo == quiz_titulo).first()
        if not quiz:
            quiz = Quiz(
                titulo=quiz_titulo,
                descripcion="Evaluación completa de 30 escenarios hiperrealistas de phishing, spear phishing y correos legítimos diseñada para entrenamiento en ciberseguridad.",
                activo=True,
                company_id=None
            )
            db.add(quiz)
            db.flush()
            print(f"[+] Creado Quiz: '{quiz.titulo}' (ID: {quiz.id})")
        else:
            print(f"[*] Quiz encontrado: '{quiz.titulo}' (ID: {quiz.id})")

        # 2. Insertar o actualizar los 30 escenarios
        print(f"\n[*] Procesando {len(scenarios_30)} escenarios realistas...")
        insertados = 0
        actualizados = 0

        for i, sc_info in enumerate(scenarios_30, 1):
            scenario = db.query(Scenario).filter(Scenario.titulo_interno == sc_info["titulo_interno"]).first()
            if not scenario:
                scenario = Scenario(
                    titulo_interno=sc_info["titulo_interno"],
                    remitente_nombre=sc_info["remitente_nombre"],
                    remitente_email=sc_info["remitente_email"],
                    asunto_simulado=sc_info["asunto_simulado"],
                    cuerpo_html=sc_info["cuerpo_html"],
                    es_phishing=sc_info["es_phishing"],
                    dificultad=sc_info["dificultad"],
                    explicacion_titulo=sc_info["explicacion_titulo"],
                    explicacion_texto=sc_info["explicacion_texto"],
                    clues=sc_info["clues"],
                    company_id=None
                )
                db.add(scenario)
                db.flush()
                insertados += 1
                print(f"  [{i:02d}/30] INSERTADO: {scenario.titulo_interno}")
            else:
                scenario.remitente_nombre = sc_info["remitente_nombre"]
                scenario.remitente_email = sc_info["remitente_email"]
                scenario.asunto_simulado = sc_info["asunto_simulado"]
                scenario.cuerpo_html = sc_info["cuerpo_html"]
                scenario.es_phishing = sc_info["es_phishing"]
                scenario.dificultad = sc_info["dificultad"]
                scenario.explicacion_titulo = sc_info["explicacion_titulo"]
                scenario.explicacion_texto = sc_info["explicacion_texto"]
                scenario.clues = sc_info["clues"]
                actualizados += 1
                print(f"  [{i:02d}/30] ACTUALIZADO: {scenario.titulo_interno}")

            # Enlazar al Quiz
            asoc = db.execute(
                quiz_scenarios.select().where(
                    quiz_scenarios.c.quiz_id == quiz.id,
                    quiz_scenarios.c.scenario_id == scenario.id
                )
            ).first()
            if not asoc:
                db.execute(
                    quiz_scenarios.insert().values(
                        quiz_id=quiz.id,
                        scenario_id=scenario.id
                    )
                )

        db.commit()
        print(f"\n=======================================================")
        print(f" ¡ÉXITO! {insertados} creados, {actualizados} actualizados.")
        print(f" Los 30 casos quedaron asociados al Quiz ID: {quiz.id} ('{quiz_titulo}')")
        print(f"=======================================================\n")

    except Exception as e:
        db.rollback()
        print(f"[!] Error durante la carga: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    run()
