import smtplib
import re
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from sqlalchemy.orm import Session
import logging

from app.models import models
from app.core.config import settings

logger = logging.getLogger("uvicorn.error")

def reescribir_enlaces(html_content: str, token: str, backend_url: str) -> str:
    """
    Busca todas las etiquetas <a href="..."> en el cuerpo HTML y reemplaza
    sus destinos por el endpoint de tracking de clics del backend.
    """
    if not html_content:
        return ""
        
    url_track = f"{backend_url}/track/click/{token}"
    
    # Expresión regular para buscar y reemplazar href
    # Reemplaza cualquier href="..." dentro de una etiqueta <a ...>
    patron = r'href=["\'](.[^"\']*)["\']'
    
    def replacement(match):
        return f'href="{url_track}"'
        
    return re.sub(patron, replacement, html_content, flags=re.IGNORECASE)

def probar_conexion_smtp(smtp_host: str, smtp_port: int, smtp_user: str, smtp_password: str, smtp_use_tls: bool, destinatario: str) -> tuple[bool, str]:
    """
    Intenta conectar con el servidor SMTP y enviar un correo de prueba.
    Retorna (exito: bool, mensaje_detalle: str).
    """
    try:
        if smtp_use_tls:
            server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
            server.starttls()
        else:
            server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
            
        if smtp_user and smtp_password:
            server.login(smtp_user, smtp_password)
            
        remitente = smtp_user if smtp_user else "plataforma@cpcemza.org.ar"
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = "✅ Prueba de Configuración SMTP Exitosa - CPCE Phishing"
        msg['From'] = f"CPCE Seguridad <{remitente}>"
        msg['To'] = destinatario
        
        cuerpo_html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #004A98; margin-top: 0;">Conexión SMTP Verificada</h2>
            <p style="color: #475569; font-size: 14px;">Este es un mensaje de prueba enviado desde la <strong>Plataforma de Capacitación y Phishing del CPCE Mendoza</strong>.</p>
            <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; font-size: 12px; color: #334155; margin: 15px 0;">
                <strong>Servidor:</strong> {smtp_host}:{smtp_port}<br/>
                <strong>Usuario:</strong> {smtp_user or 'Sin autenticación'}<br/>
                <strong>TLS:</strong> {'Activado' if smtp_use_tls else 'Desactivado'}
            </div>
            <p style="color: #10b981; font-weight: bold; font-size: 13px; margin-bottom: 0;">✓ El servidor SMTP está listo para enviar simulacros de concientización.</p>
        </div>
        """
        msg.attach(MIMEText(cuerpo_html, 'html', 'utf-8'))
        server.sendmail(remitente, [destinatario], msg.as_string())
        server.quit()
        return True, "¡Conexión y envío de prueba realizados con éxito!"
    except Exception as e:
        logger.error(f"[SMTP Test] Error al verificar servidor SMTP: {str(e)}")
        return False, str(e)

def enviar_campana_simulacion(db: Session, campaign_id: int):
    """
    Procesa y envía los correos de simulación de una campaña en segundo plano.
    Inyecta píxel de tracking pasivo y reescribe los enlaces para tracking activo.
    """
    campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
    if not campaign:
        logger.error(f"[SMTP] Campaña {campaign_id} no encontrada.")
        return
        
    scenario = campaign.scenario
    if not scenario:
        logger.error(f"[SMTP] Escenario de correo no asignado para la campaña {campaign_id}.")
        return

    # Buscar todos los tokens pendientes de envío de esta campaña
    tokens = db.query(models.SimulationToken).filter(
        models.SimulationToken.campaign_id == campaign_id,
        models.SimulationToken.enviado == False
    ).all()
    
    if not tokens:
        logger.info(f"[SMTP] No hay destinatarios pendientes para la campaña {campaign_id}.")
        return

    logger.info(f"[SMTP] Iniciando envío de {len(tokens)} correos para la campaña '{campaign.nombre}'...")

    # Cargar configuraciones SMTP: Prioridad a la Institución, fallback a .env global
    company = campaign.company
    smtp_host = (company.smtp_host if company and company.smtp_host else getattr(settings, "SMTP_HOST", "localhost"))
    smtp_port = int(company.smtp_port if company and company.smtp_port else getattr(settings, "SMTP_PORT", 1025))
    smtp_user = (company.smtp_user if company and company.smtp_user else getattr(settings, "SMTP_USER", None))
    smtp_password = (company.smtp_password if company and company.smtp_password else getattr(settings, "SMTP_PASSWORD", None))
    smtp_use_tls = (company.smtp_use_tls if company and company.smtp_use_tls is not None else getattr(settings, "SMTP_USE_TLS", False))

    try:
        # Inicializar conexión SMTP
        if smtp_use_tls:
            server = smtplib.SMTP(smtp_host, smtp_port, timeout=15)
            server.starttls()
        else:
            server = smtplib.SMTP(smtp_host, smtp_port, timeout=15)
            
        if smtp_user and smtp_password:
            server.login(smtp_user, smtp_password)
            
    except Exception as e:
        logger.error(f"[SMTP] Error al conectar con el servidor de correo ({smtp_host}:{smtp_port}): {str(e)}")
        return

    enviados_ok = 0
    for t in tokens:
        try:
            target = t.target
            
            # 1. Reescribir enlaces en el HTML para tracking activo
            html_modificado = reescribir_enlaces(scenario.cuerpo_html, t.token, settings.BACKEND_URL)
            
            # 2. Inyectar píxel transparente de tracking pasivo (1x1 img al final del body)
            pixel_tag = f'<img src="{settings.BACKEND_URL}/track/pixel/{t.token}" width="1" height="1" style="display:none;" />'
            if "</body>" in html_modificado:
                html_modificado = html_modificado.replace("</body>", f"{pixel_tag}</body>")
            else:
                html_modificado += pixel_tag
                
            # 3. Ensamblar correo MIME
            msg = MIMEMultipart('alternative')
            msg['Subject'] = scenario.asunto_simulado
            msg['From'] = f"{scenario.remitente_nombre} <{scenario.remitente_email}>"
            msg['To'] = f"{target.nombre} <{target.email}>"
            
            # Adjuntar cuerpo HTML modificado
            part_html = MIMEText(html_modificado, 'html', 'utf-8')
            msg.attach(part_html)
            
            # 4. Enviar correo real
            server.sendmail(scenario.remitente_email, [target.email], msg.as_string())
            
            # 5. Marcar como enviado en la BD
            t.enviado = True
            enviados_ok += 1
            
        except Exception as err:
            logger.error(f"[SMTP] Error al enviar correo a {target.email}: {str(err)}")
            
    # Guardar cambios de envío
    db.commit()
    
    try:
        server.quit()
    except Exception:
        pass

    logger.info(f"[SMTP] Campaña '{campaign.nombre}' finalizada. Envíos exitosos: {enviados_ok}/{len(tokens)}.")
