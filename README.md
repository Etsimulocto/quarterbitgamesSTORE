# Bloomcore Market

The public catalog and local inventory console for quarterbitgames.

## Public catalog

The site is a static storefront. Listings marked `status: "available"` and `published: true` appear in the market grid. Each item record supports a unique item ID, item type, photo filename, description, price, UPC, quantity, and an optional external checkout URL.

Payment and customer accounts remain on the configured external Spiralside checkout. This repository does not collect payment information or customer data.

## Add photos and listings

1. Clone this repository to your computer and open the public site from GitHub Pages or a local HTTPS/localhost server in Chrome or Edge.
2. Open **Admin Access** and select the local `quarterbitgamesSTORE` repo folder.
3. Drop in a photo batch. The filename stem becomes the item ID (`HJ-BL-087.jpg` → `HJ-BL-087`). Files are copied into `assets/products/` and draft records are written to `data/catalog.json`.
4. Select each listing, add its details and checkout URL, then set **Status** to Available and **Public listing** to Published when ready.
5. Review the changed files and commit/push them with GitHub Desktop or git.

The admin page writes only to the local folder you select. The hosted storefront itself is public and read-only. Keep one-off HAPPY JARZ as separate item records; repeatable products can use the same item type with their UPC and available quantity.

## Item types

- `happy-jarz`
- `bloomslice`
- `bloomtrelis`
- `other`

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
  "image": "HJ-BL-087.jpg"
}
```

## Run locally

From the repository root, run `python3 -m http.server 8000` and open `http://localhost:8000`. The admin folder picker requires a secure context such as localhost or HTTPS.
