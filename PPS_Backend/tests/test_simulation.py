import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app
from app.core.security import create_access_token
from app.models import models

# Configuración de base de datos de prueba SQLite en memoria
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(name="session")
def session_fixture():
    # Crear tablas
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(name="client")
def client_fixture(session):
    def override_get_db():
        try:
            yield session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()

@pytest.fixture(name="auth_headers")
def auth_headers_fixture(session):
    # Crear empresa de prueba
    company = models.Company(nombre="Empresa Test", dominio_google="test.com")
    session.add(company)
    session.commit()
    session.refresh(company)

    # Crear administrador de empresa
    admin = models.User(
        email="admin@test.com",
        nombre="Admin Test",
        rol="ADMIN_EMPRESA",
        company_id=company.id,
        hashed_password="hashed_password",
        debe_cambiar_password=False
    )
    session.add(admin)
    session.commit()
    session.refresh(admin)

    # Generar token JWT
    token = create_access_token(data={"sub": str(admin.id), "rol": admin.rol})
    return {"Authorization": f"Bearer {token}"}

def test_targets_crud(client, auth_headers):
    # 1. Crear destinatario (Target)
    response = client.post(
        "/targets/",
        json={"nombre": "Juan Pérez", "email": "juan@test.com", "departamento": "Sistemas"},
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["nombre"] == "Juan Pérez"
    assert data["email"] == "juan@test.com"
    target_id = data["id"]

    # 2. Leer destinatarios
    response = client.get("/targets/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["nombre"] == "Juan Pérez"

    # 3. Eliminar destinatario
    response = client.delete(f"/targets/{target_id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["detail"] == "Destinatario eliminado exitosamente"

    # Verificar eliminación
    response = client.get("/targets/", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()) == 0

def test_targets_bulk_upload(client, auth_headers):
    # Subir múltiples destinatarios en lote
    targets_data = [
        {"nombre": "Emp1", "email": "emp1@test.com", "departamento": "Ventas"},
        {"nombre": "Emp2", "email": "emp2@test.com", "departamento": "Ventas"},
        {"nombre": "Emp3", "email": "emp3@test.com", "departamento": "RRHH"}
    ]
    response = client.post("/targets/bulk", json=targets_data, headers=auth_headers)
    assert response.status_code == 200
    assert "Se procesaron" in response.json()["message"]

    # Verificar que se guardaron
    response = client.get("/targets/", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()) == 3

def test_campaigns_crud_and_launch(session, client, auth_headers):
    # Preparar escenario (plantilla de correo)
    company = session.query(models.Company).first()
    scenario = models.Scenario(
        titulo_interno="Test Phishing Template",
        remitente_nombre="Soporte",
        remitente_email="soporte@seguro.com",
        asunto_simulado="Alerta de Seguridad",
        cuerpo_html='<html><body>Haga clic <a href="http://un-enlace-malo.com">aquí</a>.</body></html>',
        es_phishing=True,
        dificultad="BAJA",
        company_id=company.id
    )
    session.add(scenario)
    
    # Agregar destinatario
    target = models.Target(
        nombre="Test Target",
        email="target@test.com",
        departamento="Finanzas",
        company_id=company.id
    )
    session.add(target)
    session.commit()

    # 1. Crear campaña
    response = client.post(
        "/campaigns/",
        json={"nombre": "Campaña de Prueba", "scenario_id": scenario.id},
        headers=auth_headers
    )
    assert response.status_code == 200
    campaign_data = response.json()
    assert campaign_data["nombre"] == "Campaña de Prueba"
    assert campaign_data["scenario_id"] == scenario.id
    campaign_id = campaign_data["id"]

    # Verificar que se generó un token automáticamente
    tokens = session.query(models.SimulationToken).filter(models.SimulationToken.campaign_id == campaign_id).all()
    assert len(tokens) == 1
    token_str = tokens[0].token

    # Mock del envío SMTP y ejecutar lanzamiento
    with patch("smtplib.SMTP") as mock_smtp:
        mock_server = MagicMock()
        mock_smtp.return_value = mock_server
        
        response = client.post(f"/campaigns/{campaign_id}/launch", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["message"] == "Campaña encolada para envío en segundo plano."
        
        # Ejecutar la background task manualmente para probarla sincrónicamente
        from app.services.email_service import enviar_campana_simulacion
        enviar_campana_simulacion(session, campaign_id)
        
        # Comprobar que el token ahora está marcado como enviado
        session.refresh(tokens[0])
        assert tokens[0].enviado is True
        assert mock_server.sendmail.called

def test_tracking_pixel_and_click(session, client, auth_headers):
    # Preparar datos de simulación
    company = session.query(models.Company).first()
    scenario = models.Scenario(
        titulo_interno="Test Phishing Template",
        remitente_nombre="Soporte",
        remitente_email="soporte@seguro.com",
        asunto_simulado="Alerta de Seguridad",
        cuerpo_html='<html><body>Link <a href="http://link.com">aquí</a>.</body></html>',
        es_phishing=True,
        dificultad="BAJA",
        company_id=company.id
    )
    session.add(scenario)
    target = models.Target(nombre="User", email="user@test.com", departamento="IT", company_id=company.id)
    session.add(target)
    session.commit()

    campaign = models.Campaign(nombre="Real Camp", scenario_id=scenario.id, company_id=company.id, activa=True)
    session.add(campaign)
    session.commit()

    token_str = "test-token-uuid-1234"
    sim_token = models.SimulationToken(token=token_str, campaign_id=campaign.id, target_id=target.id, enviado=True)
    session.add(sim_token)
    session.commit()

    # 1. Probar Tracking Pasivo (Pixel)
    response = client.get(f"/track/pixel/{token_str}")
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/gif"
    
    # Procesar registro asíncrono
    from app.crud import crud
    event_open = session.query(models.TrackingEvent).filter(
        models.TrackingEvent.token == token_str,
        models.TrackingEvent.tipo_evento == "OPEN"
    ).first()
    assert event_open is not None

    # 2. Probar Tracking Activo (Click)
    response = client.get(f"/track/click/{token_str}", follow_redirects=False)
    assert response.status_code == 307
    assert "/quiz?from_sim=" in response.headers["location"]

    event_click = session.query(models.TrackingEvent).filter(
        models.TrackingEvent.token == token_str,
        models.TrackingEvent.tipo_evento == "CLICK"
    ).first()
    assert event_click is not None
    assert event_click.ip_address != ""

def test_dashboard_stats(session, client, auth_headers):
    # Crear todos los objetos y eventos necesarios
    company = session.query(models.Company).first()
    
    # Escenario
    scenario = models.Scenario(
        titulo_interno="Test Phishing Template",
        remitente_nombre="Soporte",
        remitente_email="soporte@seguro.com",
        asunto_simulado="Alerta de Seguridad",
        cuerpo_html='<html><body>Link <a href="http://link.com">aquí</a>.</body></html>',
        es_phishing=True,
        dificultad="BAJA",
        company_id=company.id
    )
    session.add(scenario)
    
    # Targets en dos departamentos
    t1 = models.Target(nombre="User 1", email="user1@test.com", departamento="IT", company_id=company.id)
    t2 = models.Target(nombre="User 2", email="user2@test.com", departamento="Ventas", company_id=company.id)
    session.add_all([t1, t2])
    session.commit()

    # Campaña
    campaign = models.Campaign(nombre="Campaña IT y Ventas", scenario_id=scenario.id, company_id=company.id, activa=True)
    session.add(campaign)
    session.commit()

    # Simulation Tokens
    token1 = "token-it-111"
    token2 = "token-ventas-222"
    st1 = models.SimulationToken(token=token1, campaign_id=campaign.id, target_id=t1.id, enviado=True)
    st2 = models.SimulationToken(token=token2, campaign_id=campaign.id, target_id=t2.id, enviado=True)
    session.add_all([st1, st2])
    session.commit()

    # Agregar evento: IT abre el correo (OPEN), Ventas hace clic (OPEN y CLICK)
    e1_open = models.TrackingEvent(token=token1, tipo_evento="OPEN", ip_address="192.168.0.1", user_agent="Mozilla")
    e2_open = models.TrackingEvent(token=token2, tipo_evento="OPEN", ip_address="192.168.0.2", user_agent="Mozilla")
    e2_click = models.TrackingEvent(token=token2, tipo_evento="CLICK", ip_address="192.168.0.2", user_agent="Mozilla")
    session.add_all([e1_open, e2_open, e2_click])
    session.commit()

    # Consultar estadísticas del dashboard de administración
    response = client.get("/stats/dashboard", headers=auth_headers)
    assert response.status_code == 200
    stats = response.json()

    sim_stats = stats["simulacion"]
    assert sim_stats["total_enviados"] == 2
    assert sim_stats["total_abiertos"] == 2
    assert sim_stats["total_clics"] == 1
    assert sim_stats["ctr_global"] == 50.0

    # Comprobar desglose por departamentos
    depts = {d["departamento"]: d for d in sim_stats["departamentos"]}
    assert depts["IT"]["riesgo"] == 0.0 # IT no hizo click
    assert depts["Ventas"]["riesgo"] == 100.0 # Ventas hizo click
