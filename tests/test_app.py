import copy
from fastapi.testclient import TestClient
import src.app as app_module

client = TestClient(app_module.app)

# Keep an original snapshot to reset mutable in-memory data between tests
ORIGINAL_ACTIVITIES = copy.deepcopy(app_module.activities)

import pytest

@pytest.fixture(autouse=True)
def reset_activities():
    # reset the module-level activities dict before each test
    app_module.activities = copy.deepcopy(ORIGINAL_ACTIVITIES)
    yield


def test_get_activities():
    r = client.get("/activities")
    assert r.status_code == 200
    data = r.json()
    assert "Chess Club" in data


def test_signup_and_present():
    email = "testuser@example.com"
    r = client.post(f"/activities/Chess%20Club/signup?email={email}")
    assert r.status_code == 200
    data = client.get("/activities").json()
    assert email in data["Chess Club"]["participants"]


def test_signup_duplicate_fails():
    # michael@mergington.edu is pre-registered in sample data
    email = "michael@mergington.edu"
    r = client.post(f"/activities/Chess%20Club/signup?email={email}")
    assert r.status_code == 400


def test_unregister_participant():
    email = "toremove@example.com"
    # add first
    r = client.post(f"/activities/Chess%20Club/signup?email={email}")
    assert r.status_code == 200

    # now remove
    r = client.delete(f"/activities/Chess%20Club/participants?email={email}")
    assert r.status_code == 200
    data = client.get("/activities").json()
    assert email not in data["Chess Club"]["participants"]


def test_unregister_missing_returns_404():
    r = client.delete(f"/activities/Chess%20Club/participants?email=nosuch@example.com")
    assert r.status_code == 404
