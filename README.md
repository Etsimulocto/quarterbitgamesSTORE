# Bloomcore Market

The Bloomcore Market is the public, mobile-friendly catalog and local admin workbench for quarterbitgames.

## Storefront

The storefront displays catalog records that have both `status: "available"` and `published: true`. Product types currently include:

- `happy-jarz`
- `bloomslice`
- `bloomtrelis`
- `other`

Each item can have its own photo, stable item ID, name, description, price, UPC, quantity, condition, and optional Spiralside checkout URL. One-of-a-kind Happy Jarz should be listed as separate items. Keep the original photo filename so the item ID remains recognizable.

The bottom **Maker Notes** section covers build timing, care, multi-item orders, custom screen art, and rack sizes. Edit those public blurbs in Admin; they are saved in `data/store-content.json`.

## Add photos and listings

1. Put original photos in `photos-to-add/`, or use **Import Photos** in Admin. Keep useful filenames such as `HJ-BL-087.jpg` or `Bloomslice-R3.5-004.jpg`.
2. Start the local server below and open `http://localhost:8000/admin.html` in Chrome or Edge.
3. In Admin, select the local repository root folder—the folder containing `index.html`, `admin.html`, `data/`, and `assets/`.
4. Scan the photo folders or import a batch. Select each photo to create or edit its listing. Drafts and previews do not offer checkout.
5. Save listings to `data/catalog.json`. Save public Maker Notes to `data/store-content.json`.
6. Review and push the changed catalog/content files and any new product photos with GitHub Desktop or git.

The admin editor writes only to the local repo folder you select. The hosted storefront is public and read-only; it cannot write to your computer.

## Orders, shipping, and PayPal

Use the Admin **Orders, shipping & PayPal** section to record an order, buyer name/email, item summary, and item subtotal. Add shipping after the package is ready; the admin calculates the amount due as **items subtotal + shipping**. Copy the prepared invoice details and open PayPal invoicing to review and send the invoice from your PayPal account.

This is a manual PayPal workflow; the static site does not send invoices or connect to PayPal’s API. Order queue records are kept in browser local storage on the current computer and browser profile. They are not written into GitHub or shared with the public site. Clearing that browser’s site data will remove the local queue, so keep any separate business records you need.

## Catalog record

```json
{
  "id": "HJ-BL-087",
  "name": "Happy Jarz · Blue",
  "type": "happy-jarz",
  "kind": "unique",
  "price": 6,
  "upc": "",
  "quantity": 1,
  "condition": "handmade",
  "status": "available",
  "published": true,
  "description": "Listing description goes here.",
  "checkoutUrl": "https://spiralside.com/your-checkout-link",
  "image": "HJ-BL-087.jpg",
  "imageAlt": "Blue Happy Jarz mounted in a teak stand"
}
```

## Run locally on Windows

Open PowerShell and run:

```powershell
cd "$env:USERPROFILE\Documents\quarterbitgamesSTORE"
git pull --ff-only origin main
py -m http.server 8000
```

Keep PowerShell open while using the local site. Stop the server with **Ctrl+C** when finished. If your repo is stored in another folder, change the `cd` path to match it.

- Store: `http://localhost:8000/`
- Admin: `http://localhost:8000/admin.html`

The local folder picker requires Chrome or Edge on localhost or HTTPS.