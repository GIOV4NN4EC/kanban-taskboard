def test_register_and_login(client):
    payload = {"email": "test@example.com", "password": "secret123", "name": "Test User"}
    register = client.post("/auth/register", json=payload)
    assert register.status_code == 201
    assert "access_token" in register.json()

    login = client.post("/auth/login", json={"email": payload["email"], "password": payload["password"]})
    assert login.status_code == 200
    assert login.json()["user"]["email"] == payload["email"]


def test_register_duplicate_email(client):
    payload = {"email": "dup@example.com", "password": "secret123", "name": "User"}
    client.post("/auth/register", json=payload)
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 409
