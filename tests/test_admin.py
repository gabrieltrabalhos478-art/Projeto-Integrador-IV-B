from fastapi.testclient import TestClient


def test_portal_and_admin_pages_load(client: TestClient) -> None:
    portal = client.get("/")
    assert portal.status_code == 200
    assert "text/html" in portal.headers["content-type"]
    assert "Portal de Vacinação de Alagoas" in portal.text

    admin = client.get("/admin")
    assert admin.status_code == 200
    assert "text/html" in admin.headers["content-type"]
    assert "Gerenciar Pontos de Vacinação" in admin.text

    statewide = client.get("/api/portal/vaccination-points")
    assert statewide.status_code == 200
    assert len(statewide.json()) == 2
    assert statewide.json()[0]["city_name"] == "Maceió"


def test_admin_login_and_crud_flow(client: TestClient) -> None:
    # Sem token -> 401
    unauth = client.post(
        "/api/admin/vaccination-points",
        json={"city_id": 1, "name": "UBS Teste", "vaccines": ["BCG"]},
    )
    assert unauth.status_code == 401
    assert unauth.json()["error"]["code"] == "UNAUTHORIZED"

    # Senha errada -> 401
    bad_login = client.post("/api/admin/login", json={"password": "wrong"})
    assert bad_login.status_code == 401

    # Login válido (default local 'admin123')
    login = client.post("/api/admin/login", json={"password": "admin123"})
    assert login.status_code == 200
    token = login.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Criar ponto
    created = client.post(
        "/api/admin/vaccination-points",
        headers=headers,
        json={
            "city_id": 2,
            "name": "UBS Nova Arapiraca",
            "address": "Rua das Flores, 50",
            "neighborhood": "Centro",
            "phone": "(82) 3521-0000",
            "opening_hours": "08:00 - 16:00",
            "vaccines": ["BCG", "Covid-19"],
        },
    )
    assert created.status_code == 201
    point = created.json()
    assert point["name"] == "UBS Nova Arapiraca"
    assert point["vaccines"] == ["BCG", "Covid-19"]
    point_id = point["id"]

    # Conferir que aparece no GET público
    public_list = client.get("/vaccination-points/2").json()
    assert any(p["id"] == point_id for p in public_list)

    # Atualizar ponto
    updated = client.put(
        f"/api/admin/vaccination-points/{point_id}",
        headers=headers,
        json={
            "city_id": 2,
            "name": "UBS Arapiraca Atualizada",
            "vaccines": ["Influenza"],
        },
    )
    assert updated.status_code == 200
    assert updated.json()["name"] == "UBS Arapiraca Atualizada"
    assert updated.json()["vaccines"] == ["Influenza"]

    # Excluir ponto
    deleted = client.delete(
        f"/api/admin/vaccination-points/{point_id}",
        headers=headers,
    )
    assert deleted.status_code == 204

    # Excluir novamente -> 404
    not_found = client.delete(
        f"/api/admin/vaccination-points/{point_id}",
        headers=headers,
    )
    assert not_found.status_code == 404
    assert not_found.json()["error"]["code"] == "POINT_NOT_FOUND"
