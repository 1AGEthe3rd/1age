# Homepage phone controller preview

This development change reuses the 1AGE hosted controller adapter and the homepage's existing orbit and globe events. The phone's right stick turns the globe, the left stick steps through destinations, and A opens the highlighted destination. Pairing opens on demand and hides after pairing. Input is ignored while the homepage is unfocused, a dialog is open, or a text field is focused.

For a private preview, run the existing hosted controller relay behind HTTPS, add the preview origin to its ALLOWED_ORIGINS, and serve a phone-controller-config.json with a relay property containing the relay's HTTPS origin. Serve the homepage with its existing static assets. No relay endpoint or credentials are included. The native Build 008 service is separate and needs no changes.

Run node tests/phone-controller.cjs for the adapter checks. Before release, verify QR pairing, both sticks, A, focus loss, and disconnect with a real phone and the HTTPS preview.
