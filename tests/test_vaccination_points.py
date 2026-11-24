import pytest
from fastapi.testclient import TestClient


def test_list_vaccination_points_success(client: TestClient) -> None:
    response = client.get("/vaccination-points/1")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/json")
    assert response.json() == [
        {
            "id": 10,
            "city_id": 1,
            "name": "UBS Jacintinho",
            "address": "Rua Exemplo, 123",
            "neighborhood": "Jacintinho",
            "phone": "(82) 3333-0000",
            "opening_hours": "08:00 - 17:00",
            "vaccines": ["BCG", "Hepatite B"],
        },
        {
            "id": 11,
            "city_id": 1,
            "name": "UBS Benedito Bentes",
            "address": "Av. Principal, S/N",
            "neighborhood": "Benedito Bentes",
            "phone": None,
            "opening_hours": None,
            "vaccines": [],
        },
    ]


def test_list_vaccination_points_empty_for_existing_city(client: TestClient) -> None:
    response = client.get("/vaccination-points/2")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/json")
    assert response.json() == []


@pytest.mark.parametrize("invalid_id", ["abc", "0", "-1"])
def test_list_vaccination_points_invalid_id(
    client: TestClient, invalid_id: str
) -> None:
    response = client.get(f"/vaccination-points/{invalid_id}")
    assert response.status_code == 400
    assert response.headers["content-type"].startswith("application/json")
    body = response.json()
    assert body["error"]["code"] == "INVALID_ID"
    assert isinstance(body["error"]["message"], str)


def test_list_vaccination_points_city_not_found(client: TestClient) -> None:
    response = client.get("/vaccination-points/99999")
    assert response.status_code == 404
    assert response.headers["content-type"].startswith("application/json")
    body = response.json()
    assert body["error"]["code"] == "CITY_NOT_FOUND"
    assert "99999" in body["error"]["message"]
