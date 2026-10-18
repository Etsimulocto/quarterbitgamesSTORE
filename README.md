# Bloomcore Market

The public storefront for Quarterbit Games and the Bloomcore workshop. It is a lightweight static site built with HTML, CSS, JavaScript, and a JSON catalog. The public site displays only items marked `status: "available"` and `published: true`.

## Public listing rules

- Keep drafts, photo intake, and the admin workbench in the private `quarterbitgamesSTORE-build` repository.
- Copy only approved listing data, public store text, and photos for published products into this repository.
- Store product images in `assets/products/` and preserve their filenames so item IDs stay recognizable. Each one-of-a-kind Happy Jarz gets its own listing and photo.
- Product types include Happy Jarz, BloomSlice, Bloomtrelis, and other builds.
- Checkout links hand off to SpiralSide. This static site does not process payments or store buyer/order data.

## Local storefront preview on Windows

Open PowerShell and run:

```powershell
cd "$env:USERPROFILE\Documents\quarterbitgamesSTORE"
git pull --ff-only origin main
py -m http.server 8000
```

Keep PowerShell open while previewing. Stop the server with **Ctrl+C**.

- Store preview: `http://localhost:8000/`
