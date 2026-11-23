"""Fail-closed Stripe TEST-MODE preparation for 1AGE Plus.

This module is NOT wired to a public HTTP route and NEVER grants membership.
Only a trusted authenticated server may call create_session, after binding a
verified Page identity. Never pass browser-supplied account IDs to this class.
"""
from dataclasses import dataclass
import hashlib
import hmac
import json
import re
import time
from urllib.parse import urlencode, urlsplit, quote
from urllib.request import Request, urlopen

AMOUNT_CENTS = 333
CURRENCY = "usd"
INTERVAL = "month"
STRIPE_ORIGIN = "https://api.stripe.com"
VALID_SUBJECT = re.compile(r"^[a-zA-Z0-9_:\-]{8,120}$")
VALID_IDEMPOTENCY = re.compile(r"^[a-zA-Z0-9_:\-]{16,180}$")


class StripePlusError(ValueError):
    """Do not include provider secrets or customer information in errors."""


@dataclass(frozen=True)
class StripeTestConfig:
    secret_key: str
    webhook_secret: str
    price_id: str
    success_url: str
    cancel_url: str

    def __post_init__(self):
        if not self.secret_key.startswith("sk_test_") or len(self.secret_key) < 12:
            raise StripePlusError("A Stripe test-mode secret key is required")
        if not self.webhook_secret.startswith("whsec_") or len(self.webhook_secret) < 12:
            raise StripePlusError("A dedicated test webhook signing secret is required")
        if not re.fullmatch(r"price_[A-Za-z0-9]{6,}", self.price_id):
            raise StripePlusError("A configured Stripe Price ID is required")
        for url in (self.success_url, self.cancel_url):
            u = urlsplit(url)
            if (u.scheme != "https" or not u.hostname or u.username or u.password
                    or not (u.hostname == "1age.plus" or u.hostname.endswith(".1age.plus"))
                    or u.port not in (None, 443)):
                raise StripePlusError("Checkout return URLs must be HTTPS on 1age.plus")


class StripePlusTest:
    """Isolated REST helper; no production keys, demo ledger, HTTP routes or benefits."""

    def __init__(self, config: StripeTestConfig, transport=None):
        self.config = config
        self.transport = transport or self._transport

    def _transport(self, method, path, data=None, idempotency_key=None):
        if not path.startswith("/v1/") or "://" in path:
            raise StripePlusError("Invalid Stripe API path")
        headers = {
            "Authorization": "Bearer " + self.config.secret_key,
            "Accept": "application/json",
        }
        body = None
        if data is not None:
            body = urlencode(data).encode("utf-8")
            headers["Content-Type"] = "application/x-www-form-urlencoded"
        if idempotency_key:
            headers["Idempotency-Key"] = idempotency_key
        request = Request(STRIPE_ORIGIN + path, data=body, method=method, headers=headers)
        try:
            with urlopen(request, timeout=12) as response:
                raw = response.read(65537)
                if len(raw) > 65536:
                    raise StripePlusError("Stripe API response exceeded safe size")
                return json.loads(raw)
        except StripePlusError:
            raise
        except Exception:
            # Never copy secrets, server errors, or card data into client responses.
            raise StripePlusError("Stripe sandbox API request unavailable") from None

    def verify_price(self):
        p = self.transport("GET", "/v1/prices/" + quote(self.config.price_id, safe=""))
        if not isinstance(p, dict) or p.get("id") != self.config.price_id:
            raise StripePlusError("Stripe Price ID does not match configured price")
        if (p.get("livemode") is not False or p.get("active") is not True
                or p.get("type") != "recurring"
                or p.get("currency") != CURRENCY or p.get("unit_amount") != AMOUNT_CENTS
                or not isinstance(p.get("recurring"), dict)
                or p["recurring"].get("interval") != INTERVAL
                or p["recurring"].get("interval_count", 1) != 1):
            raise StripePlusError("Stripe test Price must be active $3.33 USD monthly")
        return True

    def create_session(self, verified_subject, idempotency_key):
        """Trusted service-to-service only. NEVER expose directly to the browser."""
        if not isinstance(verified_subject, str) or not VALID_SUBJECT.fullmatch(verified_subject):
            raise StripePlusError("A verified Page account subject is required")
        if verified_subject.startswith(("test_", "demo_")):
            raise StripePlusError("Disposable demo identities cannot start Stripe checkout")
        if not isinstance(idempotency_key, str) or not VALID_IDEMPOTENCY.fullmatch(idempotency_key):
            raise StripePlusError("A trusted unique checkout request key is required")
        self.verify_price()
        data = {
            "mode": "subscription",
            "line_items[0][price]": self.config.price_id,
            "line_items[0][quantity]": "1",
            "client_reference_id": verified_subject,
            "subscription_data[metadata][1age_subject]": verified_subject,
            "subscription_data[metadata][1age_product]": "plus",
            "success_url": self.config.success_url,
            "cancel_url": self.config.cancel_url,
        }
        result = self.transport("POST", "/v1/checkout/sessions", data, idempotency_key)
        if not isinstance(result, dict) or result.get("livemode") is not False:
            raise StripePlusError("Stripe checkout must remain in test mode")
        if not isinstance(result.get("id"), str) or not result["id"].startswith("cs_test_"):
            raise StripePlusError("Invalid Stripe sandbox checkout session")
        u = urlsplit(result.get("url", ""))
        if u.scheme != "https" or u.hostname not in ("checkout.stripe.com",):
            raise StripePlusError("Invalid Stripe-hosted Checkout destination")
        return {"mode": "stripe-test", "checkout_session_id": result["id"], "url": result["url"]}

    def verify_webhook(self, raw, signature, now=None):
        """Validate raw Stripe-Signature HMAC before looking at JSON event fields."""
        if not isinstance(raw, bytes) or len(raw) > 1000000:
            raise StripePlusError("Invalid Stripe webhook body")
        if not isinstance(signature, str) or len(signature) > 2048:
            raise StripePlusError("Invalid Stripe-Signature header")
        pairs = [part.strip().split("=", 1) for part in signature.split(",")]
        stamps = [v for k, v in pairs if k == "t"]
        sigs = [v for k, v in pairs if k == "v1"]
        if len(stamps) != 1 or not stamps[0].isdigit() or not sigs:
            raise StripePlusError("Invalid Stripe-Signature header")
        timestamp = int(stamps[0])
        current = int(time.time() if now is None else now)
        if abs(timestamp - current) > 300:
            raise StripePlusError("Expired Stripe webhook signature")
        digest = hmac.new(self.config.webhook_secret.encode(), stamps[0].encode() + b"." + raw, hashlib.sha256).hexdigest()
        if not any(hmac.compare_digest(digest, x) for x in sigs):
            raise StripePlusError("Stripe webhook signature mismatch")
        try:
            event = json.loads(raw)
        except (ValueError, UnicodeDecodeError):
            raise StripePlusError("Invalid Stripe webhook JSON") from None
        if (not isinstance(event, dict) or event.get("livemode") is not False
                or not isinstance(event.get("id"), str)
                or not event["id"].startswith("evt_") or not isinstance(event.get("type"), str)):
            raise StripePlusError("Only Stripe test-mode events are accepted")
        return event

    def subscription_candidate(self, verified_event):
        """Normalize a subscription event for later reconciling; NO access grants."""
        if verified_event.get("type") not in {
            "customer.subscription.created", "customer.subscription.updated",
            "customer.subscription.deleted",
        }:
            return None
        obj = verified_event.get("data", {}).get("object", {})
        if not isinstance(obj, dict):
            raise StripePlusError("Invalid Stripe subscription object")
        subject = obj.get("metadata", {}).get("1age_subject")
        if not isinstance(subject, str) or not VALID_SUBJECT.fullmatch(subject) or subject.startswith(("test_", "demo_")):
            raise StripePlusError("Subscription is not bound to a verified Page identity")
        if not str(obj.get("id", "")).startswith("sub_") or not str(obj.get("customer", "")).startswith("cus_"):
            raise StripePlusError("Stripe subscription customer binding missing")
        items = obj.get("items", {}).get("data", [])
        if not isinstance(items, list) or len(items) != 1 or not isinstance(items[0], dict):
            raise StripePlusError("Subscription must have exactly one Plus item")
        price = items[0].get("price", {})
        if (not isinstance(price, dict) or price.get("id") != self.config.price_id
                or price.get("currency") != CURRENCY or price.get("unit_amount") != AMOUNT_CENTS
                or price.get("recurring", {}).get("interval") != INTERVAL
                or items[0].get("quantity") != 1):
            raise StripePlusError("Stripe subscription price does not match Plus")
        return {
            "event_id": verified_event["id"],
            "subject": subject,
            "subscription": obj["id"],
            "customer": obj["customer"],
            "status": obj.get("status"),
            "needs_provider_reconciliation": True,
            "grants_access": False,
        }
