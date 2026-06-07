def test_update_me_profile_fields(client):
    payload = {"email": "profile@example.com", "password": "secret123", "name": "Profile User"}
    register = client.post("/auth/register", json=payload)
    user_id = register.json()["user"]["id"]

    update = client.put(
        "/users/me",
        headers={"X-User-Id": user_id},
        json={
            "name": "Updated Name",
            "description": "About me",
            "photo_url": "data:image/png;base64,abc",
        },
    )
    assert update.status_code == 200
    body = update.json()
    assert body["name"] == "Updated Name"
    assert body["description"] == "About me"
    assert body["photo_url"] == "data:image/png;base64,abc"


def test_delete_me(client):
    payload = {"email": "delete@example.com", "password": "secret123", "name": "To Delete"}
    register = client.post("/auth/register", json=payload)
    assert register.status_code == 201
    user_id = register.json()["user"]["id"]

    delete = client.delete("/users/me", headers={"X-User-Id": user_id})
    assert delete.status_code == 204

    get_me = client.get("/users/me", headers={"X-User-Id": user_id})
    assert get_me.status_code == 404
