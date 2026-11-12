# HDmiLuchi🎧 — website starter

This is a visual front-end starter for the HDmiLuchi direct-to-fan music store.

## Included
- Dark, sleek black / chrome / electric-blue design
- Home, Music Store, My Music, Bitcoin Help, Contact and Account sections
- Freaknicc listing at $1.99
- Preview player placeholder (add a short preview file)
- Clear placeholders for Lightning checkout and fan accounts

## Important: this is not a live store yet
No payments are collected. The checkout button is disabled intentionally. Fan login, purchase library, secure full-track delivery, admin dashboard, and verified Lightning payments still need a backend and provider integration. Do not publish this as a functioning paid store until those are built and tested.

## Add the official artwork and audio later
- The confirmed official single cover is already installed at `assets/freaknicc-cover.png`.
- Put a 15–30 second preview at `assets/freaknicc-preview.mp3`.
- Keep the full master track private; do not place it in a public static assets folder.

## Zero-upfront-cost rule
This starter has no paid dependencies. Hosting may have free tiers, but limits and production suitability must be checked before launch. No service account or paid plan is created by this package.

## Next technical steps
1. Add official cover art and short preview.
2. Choose a Lightning provider/wallet that keeps proceeds in BTC and supports unique invoices and payment webhooks.
3. Build server-side order creation and payment verification; never trust a browser-only payment confirmation.
4. Add fan authentication and a private purchased-track library.
5. Add a separate private admin area with MFA and role checks.
6. Test failed, expired, underpaid, duplicate and successful payments before enabling checkout.


## Release status
- Freaknicc: first single; cleaned 30-second preview included.
- Addicted: second single; approved cover art included; preview not yet supplied.
- Checkout remains disabled until a secure Lightning payment backend, order verification, tax handling and protected delivery are implemented.
