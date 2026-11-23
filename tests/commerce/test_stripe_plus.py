"""No-network Stripe Plus test-mode contract and webhook signature tests."""
import hashlib
import hmac
import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "services/checkout"))
from stripe_plus import StripePlusError, StripePlusTest, StripeTestConfig


class StripePlusSandboxTests(unittest.TestCase):
    def setUp(self):
        self.config = StripeTestConfig(
            secret_key="sk_test_placeholder_never_real",
            webhook_secret="whsec_placeholder_never_real",
            price_id="price_123456789",
            success_url="https://1age.plus/application.html?checkout=success&session_id={CHECKOUT_SESSION_ID}",
            cancel_url="https://1age.plus/application.html?checkout=cancelled",
        )
        self.calls = []

        def fake_transport(method, path, data=None, idempotency_key=None):
            self.calls.append((method, path, data, idempotency_key))
            if method == "GET":
                return self.price()
            return {
                "livemode": False,
                "id": "cs_test_123456789",
                "url": "https://checkout.stripe.com/c/pay/cs_test_123456789",
            }
        self.gateway = StripePlusTest(self.config, transport=fake_transport)

    def price(self, **overrides):
        return dict(
            id=self.config.price_id, active=True, livemode=False,
            type="recurring", currency="usd", unit_amount=333,
            recurring={"interval": "month", "interval_count": 1},
            **overrides
        )

    def test_configuration_rejects_live_secret_and_non_1age_redirects(self):
        c = vars(self.config).copy()
        for change in (
            {"secret_key": "sk_live_not_allowed"},
            {"success_url": "https://attacker.test/gather"},
            {"cancel_url": "http://1age.plus/"},
            {"price_id": "not_a_price"},
        ):
            with self.subTest(change=change), self.assertRaises(StripePlusError):
                StripeTestConfig(**(c | change))

    def test_verified_test_price_only(self):
        self.assertTrue(self.gateway.verify_price())
        for key, value in (
            ("unit_amount", 199), ("unit_amount", 100),
            ("currency", "eur"), ("livemode", True), ("active", False),
            ("type", "one_time"), ("recurring", {"interval": "year"}),
        ):
            original = self.gateway.transport
            def wrong_price(method, path, data=None, idempotency_key=None):
                p = self.price()
                p[key] = value
                return p
            self.gateway.transport = wrong_price
            try:
                with self.subTest(key=key, value=value), self.assertRaises(StripePlusError):
                    self.gateway.verify_price()
            finally:
                self.gateway.transport = original

    def test_checkout_session_uses_server_side_price_and_trusted_account(self):
        result = self.gateway.create_session("page_abc123456789", "request_abc123456789")
        self.assertEqual(result["mode"], "stripe-test")
        self.assertEqual(result["checkout_session_id"], "cs_test_123456789")
        method, path, data, idem = self.calls[1]
        self.assertEqual((method, path), ("POST", "/v1/checkout/sessions"))
        self.assertEqual(data["line_items[0][price]"], self.config.price_id)
        self.assertEqual(data["mode"], "subscription")
        self.assertEqual(data["subscription_data[metadata][1age_subject]"], "page_abc123456789")
        self.assertEqual(idem, "request_abc123456789")
        self.assertNotIn("secret_key", data)
        for bad in ("test_abc123456789", "demo_abc123456789", "x", None):
            with self.subTest(bad=bad), self.assertRaises(StripePlusError):
                self.gateway.create_session(bad, "request_abc123456789")

    def signed(self, event, now=1720000000):
        body = json.dumps(event, separators=(",", ":")).encode()
        signature = hmac.new(self.config.webhook_secret.encode(), str(now).encode() + b"." + body, hashlib.sha256).hexdigest()
        return body, f"t={now},v1={signature}"

    def event(self, **overrides):
        e = {"id": "evt_1234", "livemode": False, "type": "customer.subscription.updated", "data": {"object": self.subscription()}}
        e.update(overrides)
        return e

    def subscription(self):
        return {
            "id": "sub_1234", "customer": "cus_1234", "status": "active",
            "metadata": {"1age_subject": "page_abc123456789"},
            "items": {"data": [{"quantity": 1, "price": self.price()}]},
        }

    def test_valid_signed_webhook_never_grants_member_access(self):
        body, header = self.signed(self.event())
        verified = self.gateway.verify_webhook(body, header, now=1720000000)
        candidate = self.gateway.subscription_candidate(verified)
        self.assertFalse(candidate["grants_access"])
        self.assertTrue(candidate["needs_provider_reconciliation"])
        self.assertEqual(candidate["subject"], "page_abc123456789")
        self.assertEqual(candidate["subscription"], "sub_1234")

    def test_webhook_rejects_tampering_replays_live_mode(self):
        body, header = self.signed(self.event())
        for kwargs in (
            {"raw": body + b" ", "signature": header, "now": 1720000000},
            {"raw": body, "signature": header, "now": 1720000400},
            {"raw": body, "signature": "t=1720000000,v1=wrong", "now": 1720000000},
            {"raw": b"{}", "signature": header, "now": 1720000000},
        ):
            with self.subTest(kwargs=kwargs), self.assertRaises(StripePlusError):
                self.gateway.verify_webhook(**kwargs)
        live_body, live_header = self.signed(self.event(livemode=True))
        with self.assertRaises(StripePlusError):
            self.gateway.verify_webhook(live_body, live_header, now=1720000000)

    def test_rejects_mismatched_subscription_and_untrusted_events(self):
        e = self.event()
        e["data"]["object"]["items"]["data"][0]["price"]["unit_amount"] = 199
        with self.assertRaises(StripePlusError):
            self.gateway.subscription_candidate(e)
        e = self.event()
        e["data"]["object"]["metadata"]["1age_subject"] = "test_invalid_demo"
        with self.assertRaises(StripePlusError):
            self.gateway.subscription_candidate(e)
        self.assertIsNone(self.gateway.subscription_candidate(self.event(type="invoice.paid")))


if __name__ == "__main__":
    unittest.main()
