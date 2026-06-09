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

    # Cargar configuraciones SMTP desde variables de entorno con valores por defecto seguros
    # En desarrollo se puede usar Mailhog o un contenedor local escuchando en el puerto 1025
    smtp_host = getattr(settings, "SMTP_HOST", "localhost")
    smtp_port = int(getattr(settings, "SMTP_PORT", 1025))
    smtp_user = getattr(settings, "SMTP_USER", None)
    smtp_password = getattr(settings, "SMTP_PASSWORD", None)
    smtp_use_tls = getattr(settings, "SMTP_USE_TLS", False)

    try:
        # Inicializar conexión SMTP
        if smtp_use_tls:
            server = smtplib.SMTP(smtp_host, smtp_port)
            server.starttls()
        else:
            server = smtplib.SMTP(smtp_host, smtp_port)
            
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
