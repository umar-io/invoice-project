import json
import os
import re
import uuid
from typing import Any

import jwt
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.responses import HTMLResponse
from langchain_groq import ChatGroq
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
from dependencies import current_user, optional_current_user, public_user

from auth import (
    create_access_token,
    create_review_token,
    decode_access_token,
    decode_review_token,
    hash_password,
    verify_password,
)
from database import (
    approve_by_ceo,
    approve_by_hod,
    create_company,
    create_invoice_comment,
    create_user,
    create_invoice,
    get_account_officer,
    get_ceo,
    get_hod,
    get_invoice,
    get_user,
    get_user_by_email,
    init_db,
    list_invoice_comments,
    list_invoices,
    list_slack_channels,
    mark_invoice_paid,
    reject_invoice as reject_invoice_record,
    get_users_filtered,
    upsert_slack_channel,
)
from events import event_bus
from handlers import (
    on_invoice_approved_ceo,
    on_invoice_approved_hod,
    on_invoice_created,
    on_invoice_paid,
    on_invoice_rejected,
)
from routes_ap_ar import router as ap_ar_router


load_dotenv()

app = FastAPI(title="Approveet", version="0.2.0")
APP_BASE_URL = os.getenv("APP_BASE_URL", "http://127.0.0.1:8001").rstrip("/")
bearer_scheme = HTTPBearer()
optional_bearer_scheme = HTTPBearer(auto_error=False)

default_origins = [
    "http://localhost:5173",
    "https://ai-invoicer-demo.vercel.app",
    "https://invoice-ai-workflow.onrender.com",
]
env_origins = [
    origin.strip().rstrip("/")
    for origin in os.getenv("CORS_ORIGINS", "").split(",")
    if origin.strip()
]
origins = [*default_origins, *env_origins]

# 2. Add the CORSMiddleware to your app
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,           # List of allowed origins
    allow_credentials=True,         # Support cookies/auth headers
    allow_methods=["*"],             # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],             # Allow all custom/required headers
)
app.include_router(ap_ar_router, tags=["AP & AR"])


llm = None
if os.getenv("GROQ_API_KEY"):
    llm = ChatGroq(
        model=os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
        temperature=0,
        groq_api_key=os.getenv("GROQ_API_KEY"),
    )


class InvoiceRequest(BaseModel):
    message: str = Field(..., min_length=5)
    user_id: str | None = None


class LoginRequest(BaseModel):
    email: str
    password: str


class UserCreateRequest(BaseModel):
    name: str = Field(..., min_length=2)
    email: str
    password: str = Field(..., min_length=8)
    role: str
    department: str | None = None
    phone: str | None = None
    

class UserGetRequest(BaseModel):
    role: str


class ApprovalRequest(BaseModel):
    approver_id: str
    comment: str | None = None


class RejectionRequest(BaseModel):
    rejected_by: str
    reason: str | None = None


class PaymentRequest(BaseModel):
    account_officer_id: str
    payment_reference: str | None = None


class SignedRejectionRequest(BaseModel):
    token: str
    reason: str | None = None


class SignedPaymentRequest(BaseModel):
    token: str
    payment_reference: str | None = None


class SignedActionRequest(BaseModel):
    token: str
    comment: str | None = None


class CommentRequest(BaseModel):
    comment: str = Field(..., min_length=1, max_length=2000)


class ParsedInvoice(BaseModel):
    amount: float = Field(..., gt=0)
    purpose: str = Field(..., min_length=2) or "Invoice Request"
    department: str = Field(..., min_length=2)
    # department=department if len(department) >= 2 else "General"
    
class SignupRequest(BaseModel):
    company_name: str = Field(..., min_length=2)
    name: str = Field(..., min_length=2)
    email: str
    password: str = Field(..., min_length=8)
    phone: str | None = None


class SlackChannelRequest(BaseModel):
    department: str = Field(..., min_length=2)
    webhook_url: str = Field(..., min_length=20)


def public_user(user: dict[str, Any]) -> dict[str, Any]:
    return {
        key: value
        for key, value in user.items()
        if key not in {"password_hash"}
    }


def current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> dict[str, Any]:
    try:
        payload = decode_access_token(credentials.credentials)
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from exc

    user = get_user(payload["sub"])
    if not user:
        raise HTTPException(status_code=401, detail="User no longer exists")
    return user


def optional_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(optional_bearer_scheme),
) -> dict[str, Any] | None:
    if credentials is None:
        return None
    return current_user(credentials)


@app.on_event("startup")
def setup_app() -> None:
    init_db()
    event_bus.clear()
    event_bus.subscribe("invoice.created", on_invoice_created)
    event_bus.subscribe("invoice.approved.hod", on_invoice_approved_hod)
    event_bus.subscribe("invoice.approved.ceo", on_invoice_approved_ceo)
    event_bus.subscribe("invoice.rejected", on_invoice_rejected)
    event_bus.subscribe("invoice.paid", on_invoice_paid)


@app.get("/")
def home() -> dict[str, str]:
    return {"status": "API running", "service": "ai-operations-workspace"}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/auth/login")
def login(req: LoginRequest) -> dict[str, Any]:
    user = get_user_by_email(req.email)
    if not user or not verify_password(req.password, user.get("password_hash")):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return {
        "access_token": create_access_token(user),
        "token_type": "bearer",
        "user": public_user(user),
    }


@app.post("/auth/signup")
def signup(req: SignupRequest) -> dict[str, Any]:
    if get_user_by_email(req.email):
        raise HTTPException(status_code=409, detail="User already exists")

    company = create_company(
        {
            "id": str(uuid.uuid4()),
            "name": req.company_name.strip(),
        }
    )

    user = create_user({
        "id": str(uuid.uuid4()),
        "company_id": company["id"],
        "name": req.name,
        "email": req.email,
        "phone": req.phone,
        "role": "ceo",
        "department": "company",
        "password_hash": hash_password(req.password),
        "created_by": "self_signup",
    })

    return {
        "access_token": create_access_token(user),
        "token_type": "bearer",
        "company": company,
        "user": public_user(user),
    }

@app.get("/auth/me")
def me(user: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    return {"user": public_user(user)}

@app.get("/users")
def get_users(actor: dict[str, Any] = Depends(current_user)) -> list[dict[str, Any]]:
    role = actor.get("role", "").lower()
    current_user_id = actor.get("id")
    current_user_dept = actor.get("department")

    if role == "ceo":
        # CEO sees everyone in all departments, except themselves
        return get_users_filtered(company_id=actor["company_id"], exclude_id=current_user_id)
    
    elif role == "hod":
        # HOD sees only people in their own department, except themselves
        return get_users_filtered(
            company_id=actor["company_id"],
            dept=current_user_dept,
            exclude_id=current_user_id,
        )
    
    else:
        raise HTTPException(
            status_code=403, 
            detail="You do not have permission to view the staff list."
        )


@app.post("/users")
def add_user(req: UserCreateRequest, actor: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    role = req.role.lower()
    if role not in {"hod", "staff", "account_officer"}:
        raise HTTPException(status_code=400, detail="Role must be hod, staff, or account_officer")
    if get_user_by_email(req.email):
        raise HTTPException(status_code=409, detail="A user with this email already exists")

    if actor["role"] == "ceo":
        if role not in {"hod", "account_officer"}:
            raise HTTPException(status_code=403, detail="CEO can only add HODs and account officers")
        department = (req.department or ("finance" if role == "account_officer" else "")).lower()
        if not department:
            raise HTTPException(status_code=400, detail="Department is required")
    elif actor["role"] == "hod":
        if role != "staff":
            raise HTTPException(status_code=403, detail="HODs can only add staff")
        department = actor["department"]
    else:
        raise HTTPException(status_code=403, detail="Only CEOs and HODs can add users")

    user = create_user(
        {
            "id": str(uuid.uuid4()),
            "company_id": actor["company_id"],
            "name": req.name,
            "email": str(req.email),
            "phone": req.phone,
            "role": role,
            "department": department,
            "password_hash": hash_password(req.password),
            "created_by": actor["id"],
        }
    )
    return {"message": "User created", "user": public_user(user)}


def normalize_department(department: str) -> str:
    normalized = department.strip().lower()
    if len(normalized) < 2:
        raise HTTPException(status_code=400, detail="Department is required")
    return normalized


def require_slack_channel_admin(actor: dict[str, Any], department: str) -> None:
    role = actor.get("role", "").lower()
    if role == "ceo":
        return
    if role == "hod" and actor.get("department", "").lower() == department:
        return
    raise HTTPException(
        status_code=403,
        detail="Only CEOs or this department's HOD can manage Slack channels",
    )


def validate_slack_webhook(webhook_url: str) -> str:
    webhook_url = webhook_url.strip()
    if not webhook_url.startswith("https://hooks.slack.com/"):
        raise HTTPException(status_code=400, detail="Slack webhook must be a hooks.slack.com URL")
    return webhook_url


def public_slack_channel(channel: dict[str, Any]) -> dict[str, Any]:
    webhook_url = channel.get("webhook_url") or ""
    return {
        "company_id": channel["company_id"],
        "department": channel["department"],
        "configured": bool(webhook_url),
        "webhook_preview": f"...{webhook_url[-6:]}" if webhook_url else None,
        "updated_at": channel.get("updated_at"),
    }


@app.get("/workspace/slack/channels")
def get_slack_channels(actor: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    role = actor.get("role", "").lower()
    if role == "ceo":
        channels = list_slack_channels(actor["company_id"])
    elif role == "hod":
        channels = list_slack_channels(actor["company_id"], actor["department"])
    else:
        raise HTTPException(status_code=403, detail="Only CEOs and HODs can view Slack setup")

    return {"channels": [public_slack_channel(channel) for channel in channels]}


@app.put("/workspace/slack/channels")
def save_slack_channel(
    req: SlackChannelRequest,
    actor: dict[str, Any] = Depends(current_user),
) -> dict[str, Any]:
    department = normalize_department(req.department)
    require_slack_channel_admin(actor, department)
    webhook_url = validate_slack_webhook(req.webhook_url)
    channel = upsert_slack_channel(
        company_id=actor["company_id"],
        department=department,
        webhook_url=webhook_url,
        created_by=actor["id"],
    )
    return {"message": "Slack channel saved", "channel": public_slack_channel(channel)}


def invoice_review_url(invoice_id: str, user_id: str, stage: str) -> str:
    token = create_review_token(invoice_id=invoice_id, user_id=user_id, stage=stage)
    return f"{APP_BASE_URL}/invoice/{invoice_id}/review?token={token}"


def invoice_view_url(invoice_id: str) -> str:
    return f"{APP_BASE_URL}/invoice/{invoice_id}"


def add_invoice_comment(invoice: dict[str, Any], actor: dict[str, Any], comment: str | None) -> dict[str, Any] | None:
    if not comment or not comment.strip():
        return None
    return create_invoice_comment(
        {
            "id": str(uuid.uuid4()),
            "invoice_id": invoice["id"],
            "company_id": invoice["company_id"],
            "user_id": actor["id"],
            "comment": comment.strip(),
        }
    )


def can_view_invoice(invoice: dict[str, Any], actor: dict[str, Any]) -> bool:
    if invoice["company_id"] != actor["company_id"]:
        return False

    role = actor.get("role", "").lower()
    if role == "ceo":
        return True
    if role == "staff":
        return invoice.get("created_by") == actor["id"]
    if role in {"hod", "account_officer"}:
        return invoice.get("assigned_to") == actor["id"]
    return False


def require_invoice_visible(invoice_id: str, actor: dict[str, Any]) -> dict[str, Any]:
    invoice = get_invoice(invoice_id)
    if not invoice or not can_view_invoice(invoice, actor):
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice


def require_review_token(token: str, invoice_id: str) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
    try:
        payload = decode_review_token(token)
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired review token") from exc

    if payload.get("invoice_id") != invoice_id:
        raise HTTPException(status_code=403, detail="Review token does not belong to this invoice")

    invoice = get_invoice(invoice_id)
    actor = get_user(payload["user_id"])
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if not actor:
        raise HTTPException(status_code=401, detail="Review user no longer exists")
    if invoice.get("assigned_to") != actor["id"]:
        raise HTTPException(status_code=403, detail="Review token is no longer assigned to this user")

    expected_stage = {
        "pending_hod": "hod_review",
        "pending_ceo": "ceo_review",
        "ready_for_payment": "payment",
    }.get(invoice["status"])
    if expected_stage != payload.get("stage"):
        raise HTTPException(status_code=409, detail=f"Review token is no longer valid for {invoice['status']}")

    return payload, invoice, actor


def parse_invoice(message: str) -> ParsedInvoice:
    if llm:
        prompt = f"""
You extract invoice approval details from a user's message.

Return only JSON with these keys:
- amount: number
- purpose: short string
- department: lowercase department string

Message: {message}
"""
        response = llm.invoke(prompt)
        try:
            return ParsedInvoice.model_validate(load_first_json_object(response.content))
        except Exception:
            return parse_invoice_without_ai(message)

    return parse_invoice_without_ai(message)


def load_first_json_object(text: str) -> dict[str, Any]:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    fenced_json = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.I | re.S)
    if fenced_json:
        return json.loads(fenced_json.group(1))

    inline_json = re.search(r"\{.*\}", text, re.S)
    if inline_json:
        return json.loads(inline_json.group(0))

    raise ValueError("No JSON object found")


def parse_invoice_without_ai(message: str) -> ParsedInvoice:
    amount_match = re.search(r"(?:NGN|N|₦|\$)?\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)\s*([km])?\b", message, re.I)
    department_match = re.search(r"(?:department|dept)\s*[:\-]?\s*([a-zA-Z ]+)", message, re.I)

    if not amount_match or not department_match:
        raise HTTPException(
            status_code=422,
            detail=(
                "Could not parse invoice. Include an amount and department, "
                "or configure GROQ_API_KEY for AI extraction."
            ),
        )

    amount = float(amount_match.group(1).replace(",", ""))
    
    multiplier = amount_match.group(2)
    if multiplier:
        if multiplier.lower() == 'k':
            amount *= 1_000
        elif multiplier.lower() == 'm':
            amount *= 1_000_000
            
    department = department_match.group(1).strip().split(" for ")[0].lower()
    purpose = re.sub(amount_match.group(0), "", message, count=1).strip(" .,-")
    purpose = re.sub(r"(?:department|dept)\s*[:\-]?\s*[a-zA-Z ]+", "", purpose, flags=re.I).strip(" .,-")

    return ParsedInvoice(amount=amount, purpose=purpose or "Invoice request", department=department)


@app.post("/invoice")
def create_invoice_endpoint(
    req: InvoiceRequest,
    actor: dict[str, Any] | None = Depends(optional_current_user),
) -> dict[str, Any]:
    creator = actor if actor else get_user(req.user_id or "")
    if not creator:
        raise HTTPException(status_code=401, detail="Login required or creating user was not found")

    parsed = parse_invoice(req.message)
    hod = get_hod(parsed.department, creator["company_id"])
    if not hod:
        raise HTTPException(status_code=404, detail=f"No HOD found for {parsed.department}")

    invoice = create_invoice(
        {
            "id": str(uuid.uuid4()),
            "company_id": creator["company_id"],
            "amount": parsed.amount,
            "purpose": parsed.purpose,
            "department": parsed.department,
            "status": "pending_hod",
            "created_by": creator["id"],
            "creator_name": creator["name"],
            "assigned_to": hod["id"],
        }
    )

    event_bus.emit(
        "invoice.created",
        {
            "invoice_id": invoice["id"],
            "company_id": invoice["company_id"],
            "amount": invoice["amount"],
            "department": invoice["department"],
            "hod_email": hod["email"],
            "review_url": invoice_review_url(invoice["id"], hod["id"], "hod_review"),
        },
    )

    return {"message": "Invoice created", "invoice": invoice}

@app.get("/invoices")
def invoices(
    status: str | None = Query(default=None),
    user: dict[str, Any] = Depends(current_user)
) -> dict[str, Any]:

    role = user.get("role")
    user_id = user.get("id")

    filters = {"status": status} if status else {}

    if role == "ceo":
        # Full company access
        res = list_invoices(company_id=user["company_id"], **filters)

    elif role == "staff":
        # Only invoices they created
        res = list_invoices(
            company_id=user["company_id"],
            **filters,
            created_by=user_id
        )

    elif role in ["hod", "account_officer"]:
        # Only tasks assigned to them
        res = list_invoices(
            company_id=user["company_id"],
            **filters,
            assigned_to=user_id
        )

    else:
        return {"invoices": []}

    return {"invoices": res}


@app.get("/invoice/{invoice_id}")
def invoice_detail(invoice_id: str, user: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    invoice = require_invoice_visible(invoice_id, user)
    return {"invoice": invoice}


@app.get("/invoice/{invoice_id}/comments")
def get_invoice_comments(
    invoice_id: str,
    user: dict[str, Any] = Depends(current_user),
) -> dict[str, Any]:
    invoice = require_invoice_visible(invoice_id, user)
    return {"comments": list_invoice_comments(invoice_id, user["company_id"])}


@app.post("/invoice/{invoice_id}/comments")
def create_comment(
    invoice_id: str,
    req: CommentRequest,
    user: dict[str, Any] = Depends(current_user),
) -> dict[str, Any]:
    invoice = require_invoice_visible(invoice_id, user)
    comment = add_invoice_comment(invoice, user, req.comment)
    return {"message": "Comment added", "comment": comment}


@app.get("/invoice/{invoice_id}/review", response_class=HTMLResponse)
def review_invoice(invoice_id: str, token: str = Query(...)) -> str:
    _, invoice, _ = require_review_token(token, invoice_id)

    can_act = invoice["status"] in {"pending_hod", "pending_ceo", "ready_for_payment"}
    action_label = "Approve"
    if invoice["status"] == "pending_hod":
        action_label = "Approve as HOD"
    if invoice["status"] == "pending_ceo":
        action_label = "Approve as CEO"
    if invoice["status"] == "ready_for_payment":
        action_label = "Mark as Paid"

    disabled = "" if can_act else "disabled"
    reject_disabled = "" if invoice["status"] in {"pending_hod", "pending_ceo"} else "disabled"
    return f"""
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Review Invoice</title>
  <style>
    body {{ font-family: Arial, sans-serif; margin: 40px; max-width: 760px; color: #17202a; }}
    .panel {{ border: 1px solid #d6dde5; border-radius: 8px; padding: 24px; }}
    dt {{ font-weight: 700; margin-top: 16px; }}
    dd {{ margin: 4px 0 0; }}
    button {{ border: 0; border-radius: 6px; padding: 10px 16px; cursor: pointer; }}
    button:disabled {{ cursor: not-allowed; opacity: .5; }}
    .approve {{ background: #0f766e; color: white; }}
    .reject {{ background: #b91c1c; color: white; }}
    .actions {{ display: flex; gap: 12px; align-items: center; margin-top: 24px; flex-wrap: wrap; }}
    #result {{ margin-top: 18px; font-weight: 700; }}
  </style>
</head>
<body>
  <main class="panel">
    <h1>Invoice Review</h1>
    <dl>
      <dt>Invoice ID</dt><dd>{invoice['id']}</dd>
      <dt>Amount</dt><dd>NGN {invoice['amount']}</dd>
      <dt>Purpose</dt><dd>{invoice['purpose']}</dd>
      <dt>Department</dt><dd>{invoice['department']}</dd>
      <dt>Status</dt><dd>{invoice['status']}</dd>
    </dl>

    <div class="actions">
      <button class="approve" onclick="primaryAction()" {disabled}>{action_label}</button>
      <button class="reject" onclick="rejectInvoice()" {reject_disabled}>Reject</button>
    </div>
    <p id="result"></p>
  </main>

  <script>
    const invoiceId = {json.dumps(invoice_id)};
    const reviewToken = {json.dumps(token)};
    const status = {json.dumps(invoice["status"])};

    async function postJson(url, body) {{
      const response = await fetch(url, {{
        method: "POST",
        headers: {{ "Content-Type": "application/json" }},
        body: JSON.stringify(body)
      }});
      const data = await response.json();
      if (!response.ok) {{
        throw new Error(data.detail || "Request failed");
      }}
      return data;
    }}

    async function primaryAction() {{
      if (status === "ready_for_payment") {{
        await markPaid();
        return;
      }}
      await approveInvoice();
    }}

    async function approveInvoice() {{
      const comment = prompt("Approval comment?") || null;
      try {{
        const data = await postJson(
          `/invoice/${{invoiceId}}/approve/signed`,
          {{ token: reviewToken, comment }}
        );
        document.getElementById("result").textContent = data.message;
        setTimeout(() => location.reload(), 900);
      }} catch (error) {{
        document.getElementById("result").textContent = error.message;
      }}
    }}

    async function markPaid() {{
      const paymentReference = prompt("Payment reference?");
      if (paymentReference === null) return;
      try {{
        const data = await postJson(
          `/invoice/${{invoiceId}}/mark-paid/signed`,
          {{ token: reviewToken, payment_reference: paymentReference }}
        );
        document.getElementById("result").textContent = data.message;
        setTimeout(() => location.reload(), 900);
      }} catch (error) {{
        document.getElementById("result").textContent = error.message;
      }}
    }}

    async function rejectInvoice() {{
      const reason = prompt("Reason for rejection?");
      if (reason === null) return;
      try {{
        const data = await postJson(`/invoice/${{invoiceId}}/reject/signed`, {{ token: reviewToken, reason }});
        document.getElementById("result").textContent = data.message;
        setTimeout(() => location.reload(), 900);
      }} catch (error) {{
        document.getElementById("result").textContent = error.message;
      }}
    }}
  </script>
</body>
</html>
"""


@app.get("/invoice/{invoice_id}/review/data")
def review_invoice_data(invoice_id: str, token: str = Query(...)) -> dict[str, Any]:
    _, invoice, actor = require_review_token(token, invoice_id)
    return {"invoice": invoice, "reviewer": public_user(actor)}


@app.post("/invoice/{invoice_id}/approve")
def approve_invoice(
    invoice_id: str,
    req: ApprovalRequest,
    actor: dict[str, Any] = Depends(current_user),
) -> dict[str, Any]:
    if req.approver_id != actor["id"]:
        raise HTTPException(status_code=403, detail="Cannot approve as another user")
    return approve_invoice_for_actor(invoice_id, actor, req.comment)


def approve_invoice_for_actor(
    invoice_id: str,
    approver: dict[str, Any],
    comment: str | None = None,
) -> dict[str, Any]:
    invoice = get_invoice(invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if approver["company_id"] != invoice["company_id"]:
        raise HTTPException(status_code=403, detail="Approver belongs to a different company")

    creator = get_user(invoice["created_by"])
    if not creator:
        raise HTTPException(status_code=409, detail="Invoice creator is missing")

    if invoice["status"] == "pending_hod":
        if approver["role"] != "hod" or approver["department"].lower() != invoice["department"].lower():
            raise HTTPException(status_code=403, detail="Only this department's HOD can approve now")

        ceo = get_ceo(invoice["company_id"])
        if not ceo:
            raise HTTPException(status_code=404, detail="No CEO found for company")

        updated = approve_by_hod(invoice_id, approver["id"], ceo["id"])
        if not updated:
            raise HTTPException(status_code=409, detail="Invoice is no longer pending HOD approval")
        approval_comment = add_invoice_comment(invoice, approver, comment)

        event_bus.emit(
            "invoice.approved.hod",
            {
                "invoice_id": invoice_id,
                "company_id": invoice["company_id"],
                "staff_email": creator["email"],
                "ceo_email": ceo["email"],
                "department": invoice["department"],
                "review_url": invoice_review_url(invoice_id, ceo["id"], "ceo_review"),
            },
        )
        return {"message": "Invoice approved by HOD", "invoice": updated, "comment": approval_comment}

    if invoice["status"] == "pending_ceo":
        if approver["role"] != "ceo":
            raise HTTPException(status_code=403, detail="Only the CEO can approve now")

        account_officer = get_account_officer(invoice["company_id"])
        if not account_officer:
            raise HTTPException(status_code=404, detail="No account officer found for company")

        updated = approve_by_ceo(invoice_id, approver["id"], account_officer["id"])
        if not updated:
            raise HTTPException(status_code=409, detail="Invoice is no longer pending CEO approval")
        approval_comment = add_invoice_comment(invoice, approver, comment)

        event_bus.emit(
            "invoice.approved.ceo",
            {
                "invoice_id": invoice_id,
                "company_id": invoice["company_id"],
                "amount": updated["amount"],
                "staff_email": creator["email"],
                "account_officer_email": account_officer["email"],
                "department": invoice["department"],
                "review_url": invoice_review_url(invoice_id, account_officer["id"], "payment"),
            },
        )
        return {
            "message": "Invoice approved by CEO and routed for payment",
            "invoice": updated,
            "comment": approval_comment,
        }

    raise HTTPException(status_code=409, detail=f"Invoice is already {invoice['status']}")


@app.post("/invoice/{invoice_id}/reject")
def reject_invoice(
    invoice_id: str,
    req: RejectionRequest,
    actor: dict[str, Any] = Depends(current_user),
) -> dict[str, Any]:
    if req.rejected_by != actor["id"]:
        raise HTTPException(status_code=403, detail="Cannot reject as another user")
    return reject_invoice_for_actor(invoice_id, actor, req.reason)


def reject_invoice_for_actor(
    invoice_id: str,
    rejector: dict[str, Any],
    reason: str | None = None,
) -> dict[str, Any]:
    invoice = get_invoice(invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if rejector["company_id"] != invoice["company_id"]:
        raise HTTPException(status_code=403, detail="Rejecting user belongs to a different company")
    if invoice["status"] == "pending_hod" and rejector["role"] != "hod":
        raise HTTPException(status_code=403, detail="Only the HOD can reject at this stage")
    if invoice["status"] == "pending_ceo" and rejector["role"] != "ceo":
        raise HTTPException(status_code=403, detail="Only the CEO can reject at this stage")

    updated = reject_invoice_record(invoice_id, reason)
    if not updated:
        raise HTTPException(status_code=409, detail=f"Invoice is already {invoice['status']}")

    creator = get_user(invoice["created_by"])
    if creator:
        event_bus.emit(
            "invoice.rejected",
            {
                "invoice_id": invoice_id,
                "company_id": invoice["company_id"],
                "reason": reason,
                "staff_email": creator["email"],
                "department": invoice["department"],
                "review_url": invoice_view_url(invoice_id),
            },
        )

    return {"message": "Invoice rejected", "invoice": updated}


@app.post("/invoice/{invoice_id}/mark-paid")
def mark_paid(
    invoice_id: str,
    req: PaymentRequest,
    actor: dict[str, Any] = Depends(current_user),
) -> dict[str, Any]:
    if req.account_officer_id != actor["id"]:
        raise HTTPException(status_code=403, detail="Cannot mark payment as another user")
    return mark_paid_for_actor(invoice_id, actor, req.payment_reference)


def mark_paid_for_actor(
    invoice_id: str,
    account_officer: dict[str, Any],
    payment_reference: str | None = None,
) -> dict[str, Any]:
    invoice = get_invoice(invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if account_officer["company_id"] != invoice["company_id"]:
        raise HTTPException(status_code=403, detail="Account officer belongs to a different company")
    if account_officer["role"] != "account_officer":
        raise HTTPException(status_code=403, detail="Only an account officer can mark payment")
    if invoice["status"] != "ready_for_payment":
        raise HTTPException(status_code=409, detail=f"Invoice is {invoice['status']}, not ready for payment")

    updated = mark_invoice_paid(invoice_id, account_officer["id"], payment_reference)
    if not updated:
        raise HTTPException(status_code=409, detail="Invoice is no longer ready for payment")

    creator = get_user(invoice["created_by"])
    if creator:
        event_bus.emit(
            "invoice.paid",
            {
                "invoice_id": invoice_id,
                "company_id": invoice["company_id"],
                "payment_reference": payment_reference,
                "staff_email": creator["email"],
                "department": invoice["department"],
                "review_url": invoice_view_url(invoice_id),
            },
        )

    return {"message": "Invoice marked as paid", "invoice": updated}


@app.post("/invoice/{invoice_id}/approve/signed")
def approve_invoice_signed(invoice_id: str, req: SignedActionRequest) -> dict[str, Any]:
    _, _, actor = require_review_token(req.token, invoice_id)
    return approve_invoice_for_actor(invoice_id, actor, req.comment)


@app.post("/invoice/{invoice_id}/reject/signed")
def reject_invoice_signed(invoice_id: str, req: SignedRejectionRequest) -> dict[str, Any]:
    _, _, actor = require_review_token(req.token, invoice_id)
    return reject_invoice_for_actor(invoice_id, actor, req.reason)


@app.post("/invoice/{invoice_id}/mark-paid/signed")
def mark_paid_signed(invoice_id: str, req: SignedPaymentRequest) -> dict[str, Any]:
    _, _, actor = require_review_token(req.token, invoice_id)
    return mark_paid_for_actor(invoice_id, actor, req.payment_reference)
