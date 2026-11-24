import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services import city_service


def test_health_check(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/json")
    assert response.json() == {"status": "ok"}


def test_list_cities(client: TestClient) -> None:
    response = client.get("/cities")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/json")
    data = response.json()
    assert data == [
        {"id": 1, "name": "Maceió", "ibge_code": 2704302},
        {"id": 2, "name": "Arapiraca", "ibge_code": 2700300},
    ]


def test_get_city_by_id_success(client: TestClient) -> None:
    response = client.get("/cities/1")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/json")
    assert response.json() == {
        "id": 1,
        "name": "Maceió",
        "state": "AL",
        "ibge_code": 2704302,
        "vaccination_points_count": 2,
    }


@pytest.mark.parametrize("invalid_id", ["abc", "0", "-5"])
def test_get_city_invalid_id(client: TestClient, invalid_id: str) -> None:
    response = client.get(f"/cities/{invalid_id}")
    assert response.status_code == 400
    assert response.headers["content-type"].startswith("application/json")
    body = response.json()
    assert body["error"]["code"] == "INVALID_ID"
    assert isinstance(body["error"]["message"], str)
    assert body["error"]["message"]


def test_get_city_not_found(client: TestClient) -> None:
    response = client.get("/cities/99999")
    assert response.status_code == 404
    assert response.headers["content-type"].startswith("application/json")
    body = response.json()
    assert body["error"]["code"] == "CITY_NOT_FOUND"
    assert "99999" in body["error"]["message"]


def test_internal_error_returns_json(monkeypatch: pytest.MonkeyPatch) -> None:
    def boom(_conn: object) -> list[object]:
        raise RuntimeError("Falha simulada")

    monkeypatch.setattr(city_service, "list_cities", boom)
    with TestClient(app, raise_server_exceptions=False) as err_client:
        response = err_client.get("/cities")

    assert response.status_code == 500
    assert response.headers["content-type"].startswith("application/json")
    body = response.json()
    assert body["error"]["code"] == "INTERNAL_ERROR"
    assert isinstance(body["error"]["message"], str)
