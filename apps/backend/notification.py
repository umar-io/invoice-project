import os

from dotenv import load_dotenv
import requests


load_dotenv()

SENDGRID_API_URL = "https://api.sendgrid.com/v3/mail/send"


def send_email(to: str, subject: str, message: str) -> None:
    if os.getenv("EMAIL_PROVIDER", "console").lower() == "sendgrid":
        send_sendgrid_email(to=to, subject=subject, message=message)
        return

    print("\nEMAIL SENT")
    print("To:", to)
    print("Subject:", subject)
    print("Message:", message)
    print("----------------------\n")


def send_sendgrid_email(to: str, subject: str, message: str) -> None:
    api_key = os.getenv("SENDGRID_API_KEY")
    from_email = os.getenv("SENDGRID_FROM_EMAIL")
    from_name = os.getenv("SENDGRID_FROM_NAME", "AI Operations Workspace")

    if not api_key or not from_email:
        print("SendGrid not configured:", to, subject)
        return

    payload = {
        "personalizations": [{"to": [{"email": to}]}],
        "from": {"email": from_email, "name": from_name},
        "subject": subject,
        "content": [{"type": "text/plain", "value": message.strip()}],
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    try:
        response = requests.post(SENDGRID_API_URL, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
    except Exception as exc:
        print("SendGrid failed:", exc)
        return

    print("SendGrid email queued:", to, subject)


def send_slack(message: str, webhook_url: str | None = None) -> None:
    webhook_url = webhook_url or os.getenv("SLACK_WEBHOOK_URL", "")
    if not webhook_url:
        print("Slack not configured:", message)
        return

    try:
        response = requests.post(
            webhook_url,
            json={"text": f"*AI Operations Workspace*\n{message}"},
            timeout=10,
        )
        response.raise_for_status()
    except Exception as exc:
        print("Slack failed:", exc)
        return

    print("Slack message sent")
