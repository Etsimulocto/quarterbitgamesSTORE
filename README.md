# Bloomcore Market

This is the **public storefront** for Quarterbit Games and the Bloomcore workshop. It is a static site built with HTML, CSS, JavaScript, and a JSON catalog. The public repo has no admin page or Admin HUD button.

## Public listing rules

- Keep drafts, photo intake, and the admin workbench in the private [quarterbitgamesSTORE-build](https://github.com/Etsimulocto/quarterbitgamesSTORE-build) repo.
- Copy only approved listing data, public store copy, and product photos for items ready to appear in the public shop.
- Store product photos in `assets/products/` and preserve original filenames so item IDs stay recognizable. Each one-of-a-kind Happy Jarz gets its own listing and photo.
- Product types include Happy Jarz, BloomSlice, Bloomtrelis, and other builds.
- Checkout links hand off to SpiralSide. This static site does not process payments or store buyer/order data.

## Local storefront preview on Windows

Open PowerShell and run:

```powershell
cd "$env:USERPROFILE\Documents\quarterbitgamesSTORE"
git pull --ff-only origin main
py -m http.server 8000
```

Open [http://localhost:8000/](http://localhost:8000/). Keep PowerShell open while previewing; stop the server with **Ctrl+C**. After pulling updates, reload the browser tab with **Ctrl+R**.

### If `git pull` stops because `data/catalog.json` has local changes

The pull did not apply, so the browser may keep showing the older storefront. Preserve the local catalog edit in Git's stash, then pull again:

```powershell
git stash push -m "Keep local catalog edits out of public update" -- data/catalog.json
git pull --ff-only origin main
```

The catalog edit remains in the local Git stash. Do not pop draft/test data into the public catalog. Review and copy only approved listings from the private build repo. Then restart or reload the preview.

## Publishing

Before publishing an item, check its name, description, item ID, price, UPC, quantity, photo, and SpiralSide checkout URL. Add only approved public listings and their photos here. Use GitHub Desktop or Git to review and push the changes.
