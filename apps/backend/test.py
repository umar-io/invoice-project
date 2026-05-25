import os

from fastapi.testclient import TestClient

os.environ["EMAIL_PROVIDER"] = "console"
os.environ["SLACK_WEBHOOK_URL"] = ""

from auth import create_review_token
from main import app
from seed import ACCOUNT_OFFICER_ID, CEO_ID, HOD_ID, STAFF_ID, seed


DEMO_PASSWORD = "Password123!"


def run_smoke_test() -> None:
    seed()
    with TestClient(app) as client:
        login_response = client.post(
            "/auth/login",
            json={"email": "john@acme.com", "password": DEMO_PASSWORD},
        )
        assert login_response.status_code == 200, login_response.text
        staff_token = login_response.json()["access_token"]

        ceo_login_response = client.post(
            "/auth/login",
            json={"email": "mary@acme.com", "password": DEMO_PASSWORD},
        )
        assert ceo_login_response.status_code == 200, ceo_login_response.text
        ceo_token = ceo_login_response.json()["access_token"]

        create_hod_response = client.post(
            "/users",
            headers={"Authorization": f"Bearer {ceo_token}"},
            json={
                "name": "Demo HOD Operations",
                "email": "ops-hod-demo@acme.com",
                "password": DEMO_PASSWORD,
                "role": "hod",
                "department": "operations",
            },
        )
        assert create_hod_response.status_code in {200, 409}, create_hod_response.text

        create_response = client.post(
            "/invoice",
            headers={"Authorization": f"Bearer {staff_token}"},
            json={
                "message": "Please approve NGN 125000 for Facebook ads. Department: marketing",
            },
        )
        assert create_response.status_code == 200, create_response.text
        invoice = create_response.json()["invoice"]

        comment_response = client.post(
            f"/invoice/{invoice['id']}/comments",
            headers={"Authorization": f"Bearer {staff_token}"},
            json={"comment": "Vendor confirmed for this campaign."},
        )
        assert comment_response.status_code == 200, comment_response.text
        assert comment_response.json()["comment"]["comment"] == "Vendor confirmed for this campaign."

        bad_review_response = client.get(f"/invoice/{invoice['id']}/review")
        assert bad_review_response.status_code == 422, bad_review_response.text

        hod_review_token = create_review_token(invoice["id"], HOD_ID, "hod_review")
        review_response = client.get(f"/invoice/{invoice['id']}/review?token={hod_review_token}")
        assert review_response.status_code == 200, review_response.text

        hod_response = client.post(
            f"/invoice/{invoice['id']}/approve/signed",
            json={"token": hod_review_token, "comment": "Budget looks correct."},
        )
        assert hod_response.status_code == 200, hod_response.text
        assert hod_response.json()["invoice"]["status"] == "pending_ceo"
        assert hod_response.json()["comment"]["comment"] == "Budget looks correct."

        stale_hod_response = client.post(
            f"/invoice/{invoice['id']}/approve/signed",
            json={"token": hod_review_token},
        )
        assert stale_hod_response.status_code == 403, stale_hod_response.text

        ceo_review_token = create_review_token(invoice["id"], CEO_ID, "ceo_review")
        ceo_response = client.post(
            f"/invoice/{invoice['id']}/approve/signed",
            json={"token": ceo_review_token},
        )
        assert ceo_response.status_code == 200, ceo_response.text
        assert ceo_response.json()["invoice"]["status"] == "ready_for_payment"
        assert ceo_response.json()["invoice"]["assigned_to"] == ACCOUNT_OFFICER_ID

        payment_token = create_review_token(invoice["id"], ACCOUNT_OFFICER_ID, "payment")
        paid_response = client.post(
            f"/invoice/{invoice['id']}/mark-paid/signed",
            json={
                "token": payment_token,
                "payment_reference": "DEMO-PAY-001",
            },
        )
        assert paid_response.status_code == 200, paid_response.text
        assert paid_response.json()["invoice"]["status"] == "paid"
        assert paid_response.json()["invoice"]["payment_reference"] == "DEMO-PAY-001"

    print("Smoke test passed")


if __name__ == "__main__":
    run_smoke_test()
