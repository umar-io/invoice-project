from database import get_slack_channel
from notification import send_email, send_slack


def send_department_slack(company_id: str, department: str, message: str) -> None:
    channel = get_slack_channel(company_id, department)
    webhook_url = channel.get("webhook_url") if channel else None
    send_slack(message, webhook_url=webhook_url)


def on_invoice_created(data: dict) -> None:
    send_email(
        to=data["hod_email"],
        subject="New Invoice Pending Approval",
        message=f"""
Invoice ID: {data['invoice_id']}
Amount: NGN {data['amount']}
Department: {data['department']}

Please review and approve.
""",
    )
    message = "\n".join(
        [
            "New invoice pending HOD approval",
            f"Invoice: {data['invoice_id']}",
            f"Amount: NGN {data['amount']}",
            f"Department: {data['department']}",
            f"Review: {data['review_url']}",
        ]
    )
    send_department_slack(data["company_id"], data["department"], message)


def on_invoice_approved_hod(data: dict) -> None:
    send_email(
        to=data["staff_email"],
        subject="Invoice Approved by HOD",
        message=f"Invoice {data['invoice_id']} has been approved by HOD.",
    )

    send_email(
        to=data["ceo_email"],
        subject="Invoice Pending CEO Approval",
        message=f"Invoice {data['invoice_id']} is awaiting your approval.",
    )
    message = "\n".join(
        [
            f"Invoice approved by HOD and routed to CEO: {data['invoice_id']}",
            f"Review: {data['review_url']}",
        ]
    )
    send_department_slack(data["company_id"], data["department"], message)


def on_invoice_approved_ceo(data: dict) -> None:
    send_email(
        to=data["staff_email"],
        subject="Invoice Approved by CEO",
        message=f"""
Your invoice {data['invoice_id']} has been approved by CEO and is ready for payment.

Amount: NGN {data['amount']}
""",
    )

    send_email(
        to=data["account_officer_email"],
        subject="Invoice Ready for Payment",
        message=f"""
Invoice {data['invoice_id']} is ready for payment.

Amount: NGN {data['amount']}
Review: {data['review_url']}
""",
    )

    message = "\n".join(
        [
            f"Invoice approved by CEO and ready for payment: {data['invoice_id']}",
            f"Assigned account officer: {data['account_officer_email']}",
            f"Review: {data['review_url']}",
        ]
    )
    send_department_slack(data["company_id"], "finance", message)


def on_invoice_paid(data: dict) -> None:
    send_email(
        to=data["staff_email"],
        subject="Invoice Paid",
        message=f"""
Your invoice {data['invoice_id']} has been marked as paid.

Payment reference: {data.get('payment_reference') or 'Not provided'}
""",
    )

    message = "\n".join(
        [
            f"Invoice paid: {data['invoice_id']}",
            f"Payment reference: {data.get('payment_reference') or 'Not provided'}",
            f"Review: {data['review_url']}",
        ]
    )
    send_department_slack(data["company_id"], "finance", message)


def on_invoice_rejected(data: dict) -> None:
    reason = data.get("reason") or "Not provided"
    send_email(
        to=data["staff_email"],
        subject="Invoice Rejected",
        message=f"Invoice {data['invoice_id']} was rejected. Reason: {reason}",
    )
    message = "\n".join(
        [
            f"Invoice rejected: {data['invoice_id']}. Reason: {reason}",
            f"Review: {data['review_url']}",
        ]
    )
    send_department_slack(data["company_id"], data["department"], message)
