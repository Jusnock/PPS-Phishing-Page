import sys
import json
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.models import Scenario, Quiz, quiz_scenarios

# 5 Casos/Escenarios muy buenos y realistas
scenarios_data = [
    {
        "titulo_interno": "Soporte Microsoft - Acceso Inusual Detectado",
        "remitente_nombre": "Microsoft Security Team",
        "remitente_email": "security-alert@microsoft-support-security.com",
        "asunto_simulado": "ALERTA DE SEGURIDAD: Intento de inicio de sesión inusual detectado en su cuenta",
        "es_phishing": True,
        "dificultad": "MEDIA",
        "explicacion_titulo": "Este correo es un ataque de Phishing (Suplantación de Identidad)",
        "explicacion_texto": (
            "Microsoft nunca utiliza dominios de correo externos como 'microsoft-support-security.com' para notificaciones oficiales. "
            "Toda comunicación legítima proviene de 'microsoft.com'. Además, el enlace redirige a un dominio temporal externo (.xyz) "
            "diseñado para clonar la pantalla de inicio de sesión de Microsoft Office 365 y robar sus credenciales."
        ),
        "clues": [
            {
                "texto": "Verifique el dominio del remitente. Aunque dice 'Microsoft Security Team', la dirección de correo oficial no proviene del dominio real de Microsoft (microsoft.com).",
                "posicion": "top-20 left"
            },
            {
                "texto": "El asunto busca generar urgencia y pánico, un método clásico de ingeniería social.",
                "posicion": "top-8"
            },
            {
                "texto": "Si pasa el mouse por encima de este botón de verificación, notará que la URL de destino no es de Microsoft, sino de una página fraudulenta.",
                "posicion": "top-1/2"
            }
        ],
        "cuerpo_html": """<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
  <div style="text-align: center; border-bottom: 2px solid #0078d4; padding-bottom: 10px;">
    <h2 style="color: #0078d4; margin: 0;">Microsoft Account</h2>
  </div>
  <p>Estimado usuario,</p>
  <p>Hemos detectado un inicio de sesión inusual desde una dirección IP no reconocida (190.224.55.109 - Mendoza, Argentina) en su cuenta corporativa.</p>
  <p style="background-color: #fff9e6; border-left: 4px solid #ffcc00; padding: 10px; font-weight: bold;">
    Detalles del inicio de sesión:<br>
    Dispositivo: Windows Server 2019 / Chrome Browser<br>
    Fecha/Hora: Hace unos minutos
  </p>
  <p>Si no fue usted, es obligatorio que verifique su identidad de inmediato para evitar la suspensión definitiva de su cuenta de correo.</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="https://cpcemza-accounts-microsoft.temp-url.xyz/login" style="background-color: #0078d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Verificar Mi Cuenta de Forma Segura</a>
  </div>
  <p>Atentamente,<br><strong>Equipo de Seguridad de Cuentas Microsoft</strong></p>
</div>"""
    },
    {
        "titulo_interno": "Factura Electrónica Movistar - Legítimo",
        "remitente_nombre": "Movistar Factura Digital",
        "remitente_email": "facturadigital@movistar.com.ar",
        "asunto_simulado": "Tu factura digital del mes de Junio ya está disponible",
        "es_phishing": False,
        "dificultad": "MEDIA",
        "explicacion_titulo": "Este es un correo Legítimo",
        "explicacion_texto": (
            "El dominio del remitente (@movistar.com.ar) es el oficial de la empresa. "
            "El correo contiene detalles específicos como el número de cliente, y el enlace de descarga apunta al sitio oficial con HTTPS. "
            "No solicita credenciales urgentes ni realiza amenazas de suspensión."
        ),
        "clues": [
            {
                "texto": "La dirección del remitente proviene del dominio oficial de la empresa: movistar.com.ar.",
                "posicion": "top-20 left"
            },
            {
                "texto": "El correo incluye información de referencia única y el botón de descarga nos lleva al sitio web oficial de Movistar con certificado válido.",
                "posicion": "top-1/2"
            }
        ],
        "cuerpo_html": """<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
  <div style="background-color: #00a9e0; padding: 15px; text-align: center; border-radius: 8px 8px 0 0;">
    <h2 style="color: white; margin: 0;">Movistar</h2>
  </div>
  <div style="padding: 20px; color: #333;">
    <p>Hola <strong>Juan Francisco</strong>,</p>
    <p>Te informamos que tu factura del mes de Junio ya se encuentra disponible para visualización y descarga en los canales oficiales.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr style="background-color: #f9f9f9;">
        <td style="padding: 10px; border: 1px solid #eee;"><strong>Número de Cliente:</strong></td>
        <td style="padding: 10px; border: 1px solid #eee;">99281736-2</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #eee;"><strong>Vencimiento:</strong></td>
        <td style="padding: 10px; border: 1px solid #eee;">05/07/2026</td>
      </tr>
      <tr style="background-color: #f9f9f9;">
        <td style="padding: 10px; border: 1px solid #eee;"><strong>Importe Total:</strong></td>
        <td style="padding: 10px; border: 1px solid #eee;">$14.250,00</td>
      </tr>
    </table>
    <p>Para abonar o descargar tu factura en PDF, accede a Mi Movistar pulsando el siguiente botón:</p>
    <div style="text-align: center; margin: 25px 0;">
      <a href="https://mi.movistar.com.ar/facturacion" style="background-color: #5bc500; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">Ver y Descargar Factura</a>
    </div>
    <p style="font-size: 11px; color: #888;">Este correo electrónico es generado automáticamente. Por favor no lo respondas directamente.</p>
  </div>
</div>"""
    },
    {
        "titulo_interno": "AFIP - Notificación de Multa e Inhabilitación CUIT",
        "remitente_nombre": "Administración Federal de Ingresos Públicos",
        "remitente_email": "notificaciones@afip-gob-ar.net",
        "asunto_simulado": "NOTIFICACIÓN OBLIGATORIA: Inconsistencias graves encontradas y orden de embargo preventivo",
        "es_phishing": True,
        "dificultad": "ALTA",
        "explicacion_titulo": "Este correo es Phishing (Campaña AFIP Falsa)",
        "explicacion_texto": (
            "La AFIP nunca comunica multas o embargos mediante correos electrónicos directos "
            "ni te pedirá descargar un archivo o hacer clic en un enlace externo para solucionar tu situación fiscal. "
            "Toda comunicación oficial se hace EXCLUSIVAMENTE a través de tu Domicilio Fiscal Electrónico (dentro de afip.gob.ar)."
        ),
        "clues": [
            {
                "texto": "Fíjate bien en el remitente: afip-gob-ar.net. AFIP es un organismo del Estado Argentino y SIEMPRE utilizará el dominio oficial 'afip.gob.ar'.",
                "posicion": "top-20 left"
            },
            {
                "texto": "La AFIP nunca comunica multas o embargos a través de enlaces directos por correo ordinario.",
                "posicion": "top-1/3"
            },
            {
                "texto": "El botón apunta a un archivo ejecutable '.scr' o una página falsa fuera de la red de AFIP para robar tus datos.",
                "posicion": "top-1/2"
            }
        ],
        "cuerpo_html": """<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #c0c0c0; border-radius: 4px; padding: 0;">
  <div style="background-color: #2b3e50; padding: 15px; color: white; font-weight: bold; font-size: 18px; text-align: center;">
    AFIP - República Argentina
  </div>
  <div style="padding: 20px;">
    <h3 style="color: #c9302c;">DOMICILIO FISCAL ELECTRÓNICO - AVISO DE MULTA</h3>
    <p>Estimado contribuyente,</p>
    <p>Se le comunica que se ha registrado una <strong>Notificación de Infracción Impositiva</strong> en su contra por presuntas inconsistencias en sus últimas declaraciones juradas.</p>
    <p>Debido al vencimiento de los plazos administrativos, se ha dictado una medida de <strong>Embargo Preventivo</strong> sobre sus cuentas bancarias asociadas al CUIT.</p>
    <p>Para visualizar el detalle de los períodos reclamados, descargar la liquidación y presentar su descargo en línea antes del inicio de las acciones judiciales, ingrese a continuación:</p>
    <div style="text-align: center; margin: 25px 0;">
      <a href="https://tramites-fiscales-ar.net/afip/cuit-acceso.php" style="background-color: #2b3e50; color: white; padding: 12px 25px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">Acceder a Liquidación Impositiva</a>
    </div>
    <p style="color: red; font-size: 12px;"><strong>IMPORTANTE:</strong> Dispone de 24 horas hábiles para responder a este requerimiento antes de que la inhabilitación del CUIT sea definitiva.</p>
  </div>
  <div style="background-color: #f4f4f4; padding: 10px; font-size: 11px; text-align: center; color: #666; border-top: 1px solid #e0e0e0;">
    Administración Federal de Ingresos Públicos - Av. Hipólito Yrigoyen 370, CABA, Argentina.
  </div>
</div>"""
    },
    {
        "titulo_interno": "Netflix - Problema con la Facturación de su Suscripción",
        "remitente_nombre": "Netflix Facturación",
        "remitente_email": "info@accounts-netflix-update.com",
        "asunto_simulado": "Acción Requerida: Su cuenta de Netflix se encuentra suspendida temporalmente por falta de pago",
        "es_phishing": True,
        "dificultad": "BAJA",
        "explicacion_titulo": "Este correo es Phishing (Falso Pago Netflix)",
        "explicacion_texto": (
            "Este es un ataque de phishing muy clásico. El dominio del remitente no es el oficial (netflix.com). "
            "Busca alarmar al usuario afirmando que su cuenta fue suspendida para obligarlo a hacer clic en un enlace "
            "fraudulento donde le robarán su tarjeta de crédito."
        ),
        "clues": [
            {
                "texto": "La dirección de correo de Netflix oficial siempre finaliza con @netflix.com. Este remitente usa un dominio inventado: @accounts-netflix-update.com.",
                "posicion": "top-20 left"
            },
            {
                "texto": "El correo busca forzar una acción rápida amenazando con la pérdida del servicio.",
                "posicion": "top-8"
            },
            {
                "texto": "El enlace te redirige a una plantilla visual idéntica a Netflix pero en un dominio fraudulento.",
                "posicion": "top-1/2"
            }
        ],
        "cuerpo_html": """<div style="background-color: #141414; font-family: Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #ffffff;">
  <div style="text-align: center; margin-bottom: 30px;">
    <span style="color: #e50914; font-size: 35px; font-weight: bold; letter-spacing: -1px;">NETFLIX</span>
  </div>
  <h2 style="color: #ffffff; font-size: 24px; font-weight: bold; margin-bottom: 20px;">Problema de actualización de pago</h2>
  <p style="color: #a9a9a9; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
    Lamentablemente no pudimos procesar tu cargo de membresía mensual debido a un inconveniente con tu banco emisor. Por seguridad de tus datos de suscripción, hemos suspendido temporalmente tu cuenta.
  </p>
  <p style="color: #a9a9a9; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
    Para reanudar tu servicio de streaming y seguir disfrutando del catálogo de series y películas sin interrupciones, debes actualizar tu método de pago hoy mismo.
  </p>
  <div style="text-align: center; margin-bottom: 30px;">
    <a href="https://netflix-actualizacion-pago-ar.com/index.html" style="background-color: #e50914; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px; display: inline-block;">ACTUALIZAR DATOS DE FACTURACIÓN</a>
  </div>
  <p style="color: #555555; font-size: 12px;">
    El equipo de Netflix. Si tienes dudas, consulta nuestro Centro de Ayuda.
  </p>
</div>"""
    },
    {
        "titulo_interno": "Google Workspace - Actualización de Términos de Almacenamiento",
        "remitente_nombre": "Google Workspace Team",
        "remitente_email": "workspace-noreply@google.com",
        "asunto_simulado": "Aviso importante sobre las políticas de almacenamiento en su cuenta institucional",
        "es_phishing": False,
        "dificultad": "ALTA",
        "explicacion_titulo": "Este es un correo Legítimo",
        "explicacion_texto": (
            "El remitente utiliza el dominio legítimo de Google (@google.com). "
            "El correo es puramente informativo, no requiere que ingreses contraseñas y los enlaces "
            "apuntan al centro oficial de soporte de Google (support.google.com)."
        ),
        "clues": [
            {
                "texto": "El remitente utiliza el subdominio y dominio legítimos de Google (@google.com).",
                "posicion": "top-20 left"
            },
            {
                "texto": "Este correo es informativo. No solicita ingresar credenciales de acceso de forma directa ni realizar acciones urgentes bajo amenazas.",
                "posicion": "top-1/3"
            },
            {
                "texto": "Los enlaces apuntan a páginas oficiales de soporte y documentación de Google (support.google.com).",
                "posicion": "top-1/2"
            }
        ],
        "cuerpo_html": """<div style="font-family: Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #f0f0f0; border-radius: 8px; background-color: #ffffff;">
  <div style="display: flex; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 15px; margin-bottom: 20px;">
    <span style="font-size: 20px; font-weight: bold; color: #4285F4;">G</span>
    <span style="font-size: 20px; font-weight: bold; color: #EA4335;">o</span>
    <span style="font-size: 20px; font-weight: bold; color: #FBBC05;">o</span>
    <span style="font-size: 20px; font-weight: bold; color: #4285F4;">g</span>
    <span style="font-size: 20px; font-weight: bold; color: #34A853;">l</span>
    <span style="font-size: 20px; font-weight: bold; color: #EA4335;">e</span>
    <span style="font-size: 16px; color: #5f6368; margin-left: 8px;">Workspace</span>
  </div>
  <h3 style="color: #202124; font-size: 18px; font-weight: 500; margin-top: 0;">Actualización en la administración del almacenamiento corporativo</h3>
  <p style="color: #5f6368; font-size: 14px; line-height: 1.6;">
    Hola Juan Francisco,
  </p>
  <p style="color: #5f6368; font-size: 14px; line-height: 1.6;">
    Te escribimos para informarte que hemos actualizado las herramientas de gestión de almacenamiento en tu cuenta institucional. A partir de los próximos meses, los administradores tendrán un panel más detallado sobre el espacio utilizado por las distintas aplicaciones del Workspace (Drive, Gmail, Fotos).
  </p>
  <p style="color: #5f6368; font-size: 14px; line-height: 1.6;">
    No es necesario que realices ninguna acción. Si quieres conocer cómo consultar tu espacio consumido actual, puedes visitar la guía paso a paso en el Centro de Ayuda.
  </p>
  <div style="margin: 25px 0;">
    <a href="https://support.google.com/a/answer/10403871" style="color: #1a73e8; text-decoration: none; font-weight: bold; font-size: 14px;">Visitar el Centro de Ayuda de Google Workspace &rarr;</a>
  </div>
  <hr style="border: 0; border-top: 1px solid #eee; margin: 25px 0;">
  <p style="color: #9aa0a6; font-size: 11px; text-align: center; margin: 0;">
    Recibiste esta notificación informativa sobre cambios en los servicios de tu cuenta de Google Workspace.<br>
    Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA.
  </p>
</div>"""
    }
]

def run():
    db = SessionLocal()
    try:
        # 1. Crear el Quiz General
        quiz_titulo = "Quiz General de Concientización"
        quiz = db.query(Quiz).filter(Quiz.titulo == quiz_titulo).first()
        if not quiz:
            quiz = Quiz(
                titulo=quiz_titulo,
                descripcion="Pon a prueba tus habilidades para detectar correos fraudulentos en este cuestionario interactivo de 5 preguntas.",
                activo=True,
                company_id=None
            )
            db.add(quiz)
            db.flush()
            print(f"Creado Quiz: '{quiz.titulo}' (ID: {quiz.id})")
        else:
            print(f"Quiz existente encontrado: '{quiz.titulo}' (ID: {quiz.id})")

        # 2. Insertar los escenarios si no existen y asociarlos al Quiz
        for sc_info in scenarios_data:
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
                print(f"  -> Creado escenario: '{scenario.titulo_interno}' (ID: {scenario.id})")
            else:
                print(f"  -> Escenario existente: '{scenario.titulo_interno}' (ID: {scenario.id})")
            
            # Asociar al quiz si no está asociado
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
                print(f"     Enlazado con el Quiz '{quiz_titulo}'")
            else:
                print(f"     Ya enlazado con el Quiz '{quiz_titulo}'")

        db.commit()
        print("\n¡Carga exitosa! Se han insertado 5 preguntas y se enlazaron con el Quiz.")

    except Exception as e:
        db.rollback()
        print("Error durante la carga:", e)
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    run()
