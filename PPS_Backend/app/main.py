from fastapi import FastAPI, Depends, HTTPException, Request, BackgroundTasks, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from authlib.integrations.starlette_client import OAuth
from typing import List, Optional
import logging
from sqlalchemy.sql import func
from sqlalchemy import text

logger = logging.getLogger("uvicorn.error")

from app.core.database import engine, Base, get_db
from app.core.config import settings
from app.core.security import create_access_token, get_current_user, get_current_superadmin, verify_password, get_current_admin_empresa, get_password_hash
from app.models import models
from app.schemas import schemas
from app.crud import crud
from app.services.email_service import enviar_campana_simulacion, probar_conexion_smtp

# 1. Crear las tablas en la base de datos si no existen
# Base.metadata.create_all(bind=engine)  # <-- COMENTADO: Ahora usamos Alembic para migraciones

app = FastAPI(
    title="Fix & Play - Phishing Quiz API",
    description="Backend para plataforma multi-tenant de concientización en ciberseguridad",
    version="1.0.0"
)

@app.middleware("http")
async def force_https_scheme(request: Request, call_next):
    if settings.BACKEND_URL.startswith("https"):
        request.scope["scheme"] = "https"
    response = await call_next(request)
    return response

@app.on_event("startup")
def startup_db_seed():
    # Migración automática segura de columnas SMTP en companies
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE companies ADD COLUMN IF NOT EXISTS smtp_host VARCHAR;"))
            conn.execute(text("ALTER TABLE companies ADD COLUMN IF NOT EXISTS smtp_port INTEGER DEFAULT 587;"))
            conn.execute(text("ALTER TABLE companies ADD COLUMN IF NOT EXISTS smtp_user VARCHAR;"))
            conn.execute(text("ALTER TABLE companies ADD COLUMN IF NOT EXISTS smtp_password VARCHAR;"))
            conn.execute(text("ALTER TABLE companies ADD COLUMN IF NOT EXISTS smtp_use_tls BOOLEAN DEFAULT TRUE;"))
    except Exception as e:
        logger.warning(f"Aviso al verificar columnas SMTP: {e}")

    db = next(get_db())
    try:
        superadmins = [e.strip().lower() for e in settings.SUPERADMIN_EMAILS.split(",") if e.strip()]
        for email in superadmins:
            user = crud.get_user_by_email(db, email=email)
            if not user:
                db_user = models.User(
                    email=email,
                    nombre="SuperAdmin Inicial",
                    rol="SUPERADMIN",
                    debe_cambiar_password=False
                )
                db.add(db_user)
                db.commit()
                logger.info(f"SuperAdmin inicial creado: {email}")
            elif user.rol != "SUPERADMIN":
                user.rol = "SUPERADMIN"
                db.commit()
                logger.info(f"Usuario existente actualizado a SuperAdmin: {email}")
    except Exception as e:
        logger.error("Error durante el sembrado inicial de base de datos", exc_info=True)

# ==========================
# MIDDLEWARES
# ==========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

app.add_middleware(
    SessionMiddleware, 
    secret_key=settings.SECRET_KEY
)

# ==========================
# CONFIGURACIÓN OAUTH2 (GOOGLE)
# ==========================
oauth = OAuth()
oauth.register(
    name='google',
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile'
    }
)

# ==========================================
#        SISTEMA DE AUTENTICACIÓN (LOGIN)
# ==========================================
@app.get("/login", tags=["Autenticación"])
async def login_via_google(request: Request):
    """Inicia el flujo de login con Google"""
    redirect_uri = request.url_for('auth_callback')
    return await oauth.google.authorize_redirect(request, redirect_uri)

@app.get("/auth/callback", tags=["Autenticación"])
async def auth_callback(request: Request, db: Session = Depends(get_db)):
    """Atrapa la respuesta de Google, crea el usuario si no existe y genera el Token"""
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception as e:
        logger.error("Error de autenticación con Google", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Error de autenticación con Google: {e}")
    
    user_info = token.get('userinfo') or {}
    if not user_info or 'email' not in user_info:
        logger.error("No se pudo obtener info de usuario Google: %s", user_info)
        raise HTTPException(status_code=400, detail="No se pudo obtener la información del usuario desde Google")
    
    email = user_info.get("email")
    nombre = user_info.get("name")
    dominio = email.split("@")[1] if "@" in email else ""
    
    # Buscar si el usuario ya existe
    user = crud.get_user_by_email(db, email=email)
    
    superadmins = [e.strip().lower() for e in settings.SUPERADMIN_EMAILS.split(",") if e.strip()]
    
    # Si no existe, lo creamos dinámicamente
    if not user:
        company = crud.get_company_by_domain(db, dominio=dominio)
        company_id = company.id if company else None
        
        # Asignar rol SUPERADMIN si el email está en la lista del .env
        rol = "SUPERADMIN" if email.lower() in superadmins else "EMPLEADO"
        
        new_user = schemas.UserCreate(
            email=email,
            nombre=nombre,
            rol=rol,
            company_id=company_id,
            password=None
        )
        user = crud.create_user(db=db, user=new_user)
        
        # ✨ MAGIA AQUÍ: Como entró por Google, le apagamos la alarma de contraseña
        user.debe_cambiar_password = False
        db.commit()
    else:
        # ✨ Y AQUÍ: Si ya existía pero entró con Google, también se la apagamos
        if user.debe_cambiar_password:
            user.debe_cambiar_password = False
            
        # Si ya existe pero su email se agregó después a la lista de superadmins, lo actualizamos
        if email.lower() in superadmins and user.rol != "SUPERADMIN":
            user.rol = "SUPERADMIN"
            
        db.commit()
    
    # Generar nuestro propio JWT con el ID y el ROL
    access_token = create_access_token(data={"sub": str(user.id), "rol": user.rol})
    
    # Redirigir al frontend con el token en la URL
    return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?token={access_token}")

@app.post("/auth/login", tags=["Autenticación"])
def login_manual(user_credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    """Login tradicional con Correo y Contraseña"""
    user = crud.get_user_by_email(db, email=user_credentials.email)
    
    # Verificamos que exista y que tenga contraseña (que no sea exclusivo de Google)
    if not user or not user.hashed_password:
        raise HTTPException(status_code=401, detail="Credenciales inválidas o usuario de Google.")
    
    if not verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Credenciales inválidas.")
        
    access_token = create_access_token(data={"sub": str(user.id), "rol": user.rol})
    return {"access_token": access_token, "token_type": "bearer"}


# ==========================================
#        ABM EMPRESAS (Solo Super-Admin)
# ==========================================
@app.post("/companies/", response_model=schemas.CompanyResponse, tags=["Empresas"])
def create_company(company: schemas.CompanyCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_superadmin)):
    db_company = crud.get_company_by_domain(db, dominio=company.dominio_google)
    if db_company:
        raise HTTPException(status_code=400, detail="El dominio ya está registrado.")
    return crud.create_company(db=db, company=company)

@app.get("/companies/", response_model=List[schemas.CompanyResponse], tags=["Empresas"])
def read_companies(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_superadmin)):
    return crud.get_companies(db, skip=skip, limit=limit)

@app.put("/companies/{company_id}", response_model=schemas.CompanyResponse, tags=["Empresas"])
def update_company(company_id: int, company: schemas.CompanyCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_superadmin)):
    """Modifica una empresa existente."""
    db_company = crud.get_company(db, company_id)
    if not db_company:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    return crud.update_company(db=db, company_id=company_id, company=company)

@app.delete("/companies/{company_id}", tags=["Empresas"])
def delete_company(company_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_superadmin)):
    """Elimina una empresa y en cascada todo lo que le pertenece."""
    db_company = crud.get_company(db, company_id)
    if not db_company:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    crud.delete_company(db=db, company_id=company_id)
    return {"detail": "Empresa eliminada exitosamente"}

# ==========================================
#        ABM USUARIOS (Admin Empresa y SuperAdmin)
# ==========================================
@app.post("/users/", response_model=schemas.UserResponse, tags=["Usuarios"])
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin_empresa)):
    if current_user.rol == "ADMIN_EMPRESA" or (current_user.rol == "SUPERADMIN" and user.company_id is None):
        user.company_id = current_user.company_id
    if current_user.rol == "ADMIN_EMPRESA":
        if user.rol == "SUPERADMIN":
            raise HTTPException(status_code=403, detail="No puedes crear un SuperAdmin.")
            
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="El correo ya está registrado.")
    return crud.create_user(db=db, user=user)

@app.get("/users/", response_model=List[schemas.UserResponse], tags=["Usuarios"])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin_empresa)):
    return crud.get_users(db, skip=skip, limit=limit)

@app.put("/users/change-password", tags=["Usuarios"])
def cambiar_password_obligatorio(
    request: schemas.PasswordChangeRequest, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    # 1. Buscamos al usuario en la base de datos
    user = db.query(models.User).filter(models.User.id == current_user.id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # 2. AQUÍ ESTABA EL ERROR: Era 'hashed_password', no 'password'
    user.hashed_password = get_password_hash(request.nueva_password)
    
    # 3. Apagamos la alarma
    user.debe_cambiar_password = False 
    
    # 4. Guardamos los cambios en la base de datos
    db.commit()
    
    return {"message": "Contraseña actualizada exitosamente"}

@app.put("/users/{user_id}", response_model=schemas.UserResponse, tags=["Usuarios"])
def update_user(user_id: int, user: schemas.UserCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin_empresa)):
    db_user = crud.get_user(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # CANDADO DE SEGURIDAD: El Admin Local solo toca a su gente, y NUNCA a un SuperAdmin
    if current_user.rol == "ADMIN_EMPRESA":
        if db_user.company_id != current_user.company_id or db_user.rol == "SUPERADMIN":
            raise HTTPException(status_code=403, detail="No tienes permiso para modificar este usuario.")

    return crud.update_user(db=db, user_id=user_id, user_update=user)

@app.delete("/users/{user_id}", tags=["Usuarios"])
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin_empresa)):
    db_user = crud.get_user(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # CANDADO DE SEGURIDAD:
    if current_user.rol == "ADMIN_EMPRESA":
        if db_user.company_id != current_user.company_id or db_user.rol == "SUPERADMIN":
            raise HTTPException(status_code=403, detail="No tienes permiso para eliminar este usuario.")

    crud.delete_user(db=db, user_id=user_id)
    return {"detail": "Usuario eliminado exitosamente"}

# ==========================================
#        ABM ESCENARIOS (Preguntas HTML)
# ==========================================
@app.post("/scenarios/", response_model=schemas.ScenarioResponse, tags=["Escenarios (Preguntas)"])
def create_scenario(scenario: schemas.ScenarioCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin_empresa)):
    if current_user.rol == "ADMIN_EMPRESA":
        scenario.company_id = current_user.company_id
    return crud.create_scenario(db=db, scenario=scenario)

@app.get("/scenarios/", response_model=List[schemas.ScenarioResponse], tags=["Escenarios (Preguntas)"])
def read_scenarios(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    company_id = current_user.company_id if current_user.rol != "SUPERADMIN" else None
    return crud.get_scenarios(db, company_id=company_id)

@app.put("/scenarios/{scenario_id}", response_model=schemas.ScenarioResponse, tags=["Escenarios (Preguntas)"])
def update_scenario(scenario_id: int, scenario: schemas.ScenarioCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin_empresa)):
    db_scenario = db.query(models.Scenario).filter(models.Scenario.id == scenario_id).first()
    if not db_scenario: raise HTTPException(status_code=404, detail="Escenario no encontrado")
    if current_user.rol == "ADMIN_EMPRESA" and db_scenario.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="No tienes permiso para modificar este escenario.")
    return crud.update_scenario(db=db, scenario_id=scenario_id, scenario_update=scenario)

@app.delete("/scenarios/{scenario_id}", tags=["Escenarios (Preguntas)"])
def delete_scenario(scenario_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin_empresa)):
    db_scenario = db.query(models.Scenario).filter(models.Scenario.id == scenario_id).first()
    if not db_scenario: raise HTTPException(status_code=404, detail="Escenario no encontrado")
    if current_user.rol == "ADMIN_EMPRESA" and db_scenario.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="No tienes permiso para eliminar este escenario.")
    crud.delete_scenario(db=db, scenario_id=scenario_id)
    return {"detail": "Escenario eliminado"}

# ==========================================
#        ABM QUIZZES (Campañas / Exámenes)
# ==========================================
@app.post("/quizzes/", response_model=schemas.QuizResponse, tags=["Quizzes (Campañas)"])
def create_quiz(quiz: schemas.QuizCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin_empresa)):
    if current_user.rol == "ADMIN_EMPRESA":
        quiz.company_id = current_user.company_id
    return crud.create_quiz(db=db, quiz=quiz)

@app.get("/quizzes/", response_model=List[schemas.QuizResponse], tags=["Quizzes (Campañas)"])
def read_quizzes(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    company_id = current_user.company_id if current_user.rol != "SUPERADMIN" else None
    quizzes = crud.get_quizzes(db, company_id=company_id)
    
    if current_user.rol == "EMPLEADO":
        import random
        # Buscamos todas las preguntas (escenarios) de la empresa o globales
        preguntas_disponibles = crud.get_scenarios(db, company_id=company_id)
        
        response_quizzes = []
        for q in quizzes:
            # Mezclamos y tomamos 10 aleatorias para este intento
            preguntas_temp = list(preguntas_disponibles)
            random.shuffle(preguntas_temp)
            preguntas_seleccionadas = preguntas_temp[:10]
            
            # Construimos un schema de respuesta temporal sin modificar la DB
            q_response = schemas.QuizResponse(
                id=q.id,
                titulo=q.titulo,
                descripcion=q.descripcion,
                activo=q.activo,
                fecha_creacion=q.fecha_creacion,
                company_id=q.company_id,
                scenarios=preguntas_seleccionadas
            )
            response_quizzes.append(q_response)
        return response_quizzes
        
    return quizzes


@app.put("/quizzes/{quiz_id}", response_model=schemas.QuizResponse, tags=["Quizzes (Campañas)"])
def update_quiz(quiz_id: int, quiz: schemas.QuizCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin_empresa)):
    db_quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    if not db_quiz: raise HTTPException(status_code=404, detail="Quiz no encontrado")
    if current_user.rol == "ADMIN_EMPRESA" and db_quiz.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="No tienes permiso para modificar este quiz.")
    return crud.update_quiz(db=db, quiz_id=quiz_id, quiz_update=quiz)

@app.delete("/quizzes/{quiz_id}", tags=["Quizzes (Campañas)"])
def delete_quiz(quiz_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin_empresa)):
    db_quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    if not db_quiz: raise HTTPException(status_code=404, detail="Quiz no encontrado")
    if current_user.rol == "ADMIN_EMPRESA" and db_quiz.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="No tienes permiso para eliminar este quiz.")
    crud.delete_quiz(db=db, quiz_id=quiz_id)
    return {"detail": "Quiz eliminado"}

# ==========================================
#        MOTOR DEL JUEGO (Sesiones y Respuestas)
# ==========================================
@app.post("/sessions/", response_model=schemas.QuizSessionResponse, tags=["Motor del Quiz"])
def create_session(session: schemas.QuizSessionCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Pasamos el current_user.id directamente a la función CRUD
    return crud.create_quiz_session(db=db, session=session, user_id=current_user.id)

@app.post("/sessions/{session_id}/answers/", response_model=schemas.SessionAnswerResponse, tags=["Motor del Quiz"])
def submit_answer(session_id: int, answer: schemas.SessionAnswerCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    escenario = db.query(models.Scenario).filter(models.Scenario.id == answer.scenario_id).first()
    if not escenario:
        raise HTTPException(status_code=404, detail="Escenario no encontrado")
    
    # Evalúa si acertó o no
    acierto = (escenario.es_phishing == answer.identificado_como_phishing)
    return crud.create_session_answer(db=db, answer=answer, session_id=session_id, acierto=acierto)

# main.py
@app.put("/sessions/{session_id}/finish")
def finish_session(session_id: int, db: Session = Depends(get_db)):
    db_session = db.query(models.QuizSession).filter(models.QuizSession.id == session_id).first()
    if db_session:
        db_session.fecha_fin = func.now()
        db.commit()
    return {"status": "ok"}

# ==========================================
#        DASHBOARD Y REPORTES EJECUTIVOS
# ==========================================

@app.get("/stats/dashboard", tags=["Dashboard"])
def get_dashboard_stats(
    company_id: Optional[int] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Devuelve las estadísticas y el nivel de riesgo de los empleados.
    - ADMIN_EMPRESA: Solo ve los datos de su propia institución.
    - SUPERADMIN: Ve los datos de la institución solicitada (o globales si no envía ID).
    """
    
    # 1. Filtro de Seguridad y Permisos
    if current_user.rol == "ADMIN_EMPRESA":
        target_company_id = current_user.company_id
    elif current_user.rol == "SUPERADMIN":
        target_company_id = company_id
    else:
        raise HTTPException(status_code=403, detail="No tienes perfil de administrador para ver estos reportes.")

    # 2. Llamada al "Cerebro" de datos en crud.py
    if target_company_id:
        # Reporte detallado de una empresa específica (Admin Local)
        return crud.get_admin_dashboard_stats(db, company_id=target_company_id)
    else:
        # Reporte global de todas las empresas (SuperAdmin viendo el panorama general)
        return crud.get_superadmin_dashboard_stats(db)
    


# ==========================================
#        PERFIL DE USUARIO (LOGIN)
# ==========================================
@app.get("/users/me", response_model=schemas.UserResponse, tags=["Perfil"])
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user


# ==========================================
#        ABM DESTINATARIOS (TARGETS)
# ==========================================
@app.post("/targets/", response_model=schemas.TargetResponse, tags=["Destinatarios de Simulación"])
def create_target(target: schemas.TargetCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin_empresa)):
    if current_user.rol == "ADMIN_EMPRESA" or (current_user.rol == "SUPERADMIN" and target.company_id is None):
        target.company_id = current_user.company_id
    db_target = crud.get_target_by_email(db, email=target.email, company_id=target.company_id)
    if db_target:
        raise HTTPException(status_code=400, detail="El correo del destinatario ya está registrado en la empresa.")
    return crud.create_target(db=db, target=target)

@app.get("/targets/", response_model=List[schemas.TargetResponse], tags=["Destinatarios de Simulación"])
def read_targets(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin_empresa)):
    company_id = current_user.company_id if current_user.rol == "ADMIN_EMPRESA" else None
    return crud.get_targets(db, company_id=company_id, skip=skip, limit=limit)

@app.post("/targets/bulk", tags=["Destinatarios de Simulación"])
def create_targets_bulk(targets: List[dict], db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin_empresa)):
    company_id = current_user.company_id
    count = crud.create_targets_bulk(db=db, targets=targets, company_id=company_id)
    return {"message": f"Se procesaron {len(targets)} destinatarios, creados {count} nuevos registros."}

@app.delete("/targets/{target_id}", tags=["Destinatarios de Simulación"])
def delete_target(target_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin_empresa)):
    db_target = crud.get_target(db, target_id)
    if not db_target:
        raise HTTPException(status_code=404, detail="Destinatario no encontrado")
    if current_user.rol == "ADMIN_EMPRESA" and db_target.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="No tienes permisos para eliminar este destinatario.")
    crud.delete_target(db=db, target_id=target_id)
    return {"detail": "Destinatario eliminado exitosamente"}


# ==========================================
#        CAMPANAS DE SIMULACION REAL
# ==========================================
@app.post("/campaigns/", response_model=schemas.CampaignResponse, tags=["Campañas de Simulación"])
def create_campaign(campaign: schemas.CampaignCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin_empresa)):
    if current_user.rol == "ADMIN_EMPRESA" or (current_user.rol == "SUPERADMIN" and campaign.company_id is None):
        campaign.company_id = current_user.company_id
    
    db_scenario = db.query(models.Scenario).filter(models.Scenario.id == campaign.scenario_id).first()
    if not db_scenario:
        raise HTTPException(status_code=404, detail="Escenario no encontrado")
        
    return crud.create_campaign(db=db, campaign=campaign)

@app.get("/campaigns/", response_model=List[schemas.CampaignResponse], tags=["Campañas de Simulación"])
def read_campaigns(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin_empresa)):
    company_id = current_user.company_id if current_user.rol == "ADMIN_EMPRESA" else None
    return crud.get_campaigns(db, company_id=company_id, skip=skip, limit=limit)

@app.delete("/campaigns/{campaign_id}", tags=["Campañas de Simulación"])
def delete_campaign(campaign_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin_empresa)):
    db_campaign = crud.get_campaign(db, campaign_id)
    if not db_campaign:
        raise HTTPException(status_code=404, detail="Campaña no encontrada")
    if current_user.rol == "ADMIN_EMPRESA" and db_campaign.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="No tienes permisos para eliminar esta campaña.")
    crud.delete_campaign(db=db, campaign_id=campaign_id)
    return {"detail": "Campaña eliminada exitosamente"}

@app.post("/campaigns/{campaign_id}/launch", tags=["Campañas de Simulación"])
def launch_campaign(campaign_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin_empresa)):
    db_campaign = crud.get_campaign(db, campaign_id)
    if not db_campaign:
        raise HTTPException(status_code=404, detail="Campaña no encontrada")
    if current_user.rol == "ADMIN_EMPRESA" and db_campaign.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="No tienes permisos para ejecutar esta campaña.")
        
    background_tasks.add_task(enviar_campana_simulacion, db, campaign_id)
    return {"message": "Campaña encolada para envío en segundo plano."}


# ==========================================
#        SISTEMA DE TRACKING (PÍXEL Y CLIC)
# ==========================================
@app.get("/track/pixel/{token}", tags=["Tracking"])
def track_pixel(token: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Tracking pasivo: sirve una imagen GIF transparente de 1x1 píxeles
    y registra la apertura en segundo plano.
    """
    logger.info(f"[TRACKING] Registro de apertura pasiva por píxel con token: {token}")
    background_tasks.add_task(crud.registrar_evento_tracking, db, token, "OPEN")
    
    gif_transparent = b'GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;'
    return Response(content=gif_transparent, media_type="image/gif")

@app.get("/track/click/{token}", tags=["Tracking"])
def track_click(token: str, request: Request, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Tracking activo: intercepta el clic en el enlace, registra IP y User-Agent,
    y redirige a la página educativa.
    """
    ip_address = request.client.host if request.client else "IP Desconocida"
    user_agent = request.headers.get("user-agent", "UA Desconocido")
    
    logger.info(f"[TRACKING] Registro de clic activo con token: {token} desde {ip_address}")
    background_tasks.add_task(crud.registrar_evento_tracking, db, token, "CLICK", ip_address, user_agent)
    
    redirect_url = f"{settings.FRONTEND_URL}/quiz?from_sim={token}"
    return RedirectResponse(url=redirect_url)


# ==========================================
#        CONFIGURACIÓN SERVIDOR SMTP
# ==========================================
@app.get("/smtp/config", response_model=schemas.SMTPConfig, tags=["Configuración SMTP"])
def get_smtp_config(company_id: Optional[int] = None, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin_empresa)):
    """Obtiene la configuración SMTP de la institución o del entorno global."""
    target_company_id = company_id if (current_user.rol == "SUPERADMIN" and company_id) else current_user.company_id
    if target_company_id:
        company = crud.get_company(db, target_company_id)
        if company and company.smtp_host:
            return schemas.SMTPConfig(
                smtp_host=company.smtp_host or "",
                smtp_port=company.smtp_port or 587,
                smtp_user=company.smtp_user or "",
                smtp_password=company.smtp_password or "",
                smtp_use_tls=company.smtp_use_tls if company.smtp_use_tls is not None else True
            )
    return schemas.SMTPConfig(
        smtp_host=getattr(settings, "SMTP_HOST", "") or "",
        smtp_port=int(getattr(settings, "SMTP_PORT", 587)),
        smtp_user=getattr(settings, "SMTP_USER", "") or "",
        smtp_password=getattr(settings, "SMTP_PASSWORD", "") or "",
        smtp_use_tls=bool(getattr(settings, "SMTP_USE_TLS", True))
    )

@app.put("/smtp/config", response_model=schemas.SMTPConfig, tags=["Configuración SMTP"])
def update_smtp_config(config: schemas.SMTPConfig, company_id: Optional[int] = None, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin_empresa)):
    """Actualiza los parámetros del servidor SMTP para la institución."""
    target_company_id = company_id if (current_user.rol == "SUPERADMIN" and company_id) else current_user.company_id
    if not target_company_id:
        raise HTTPException(status_code=400, detail="Debe indicar la institución para asociar el servidor SMTP.")
    
    company = crud.get_company(db, target_company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Institución no encontrada.")
        
    company.smtp_host = config.smtp_host
    company.smtp_port = config.smtp_port
    company.smtp_user = config.smtp_user
    if config.smtp_password:
        company.smtp_password = config.smtp_password
    company.smtp_use_tls = config.smtp_use_tls
    db.commit()
    db.refresh(company)
    
    return schemas.SMTPConfig(
        smtp_host=company.smtp_host or "",
        smtp_port=company.smtp_port or 587,
        smtp_user=company.smtp_user or "",
        smtp_password=company.smtp_password or "",
        smtp_use_tls=company.smtp_use_tls
    )

@app.post("/smtp/test", tags=["Configuración SMTP"])
def test_smtp_config(request: schemas.SMTPTestRequest, current_user: models.User = Depends(get_current_admin_empresa)):
    """Prueba la conexión enviando un correo de verificación en tiempo real."""
    destinatario = request.destinatario_prueba or current_user.email
    exito, detalle = probar_conexion_smtp(
        smtp_host=request.smtp_host,
        smtp_port=request.smtp_port,
        smtp_user=request.smtp_user or "",
        smtp_password=request.smtp_password or "",
        smtp_use_tls=request.smtp_use_tls,
        destinatario=destinatario
    )
    if not exito:
        raise HTTPException(status_code=400, detail=f"Error de conexión SMTP: {detalle}")
    return {"success": True, "message": f"¡Prueba SMTP exitosa! Correo enviado a {destinatario}"}