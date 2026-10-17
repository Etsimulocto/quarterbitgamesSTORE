# Photo drop folder

Drop original product photos here for catalog intake. Keep the original filename you want to use as the item ID, for example `HJ-BL-087.jpg` or `Bloomslice-R3.5-004.jpg`.

Files in this folder do not appear on the public storefront by themselves. Admin scans both `photos-to-add/` and `assets/products/`; selecting an unlisted photo creates a draft record that points to that photo. The **Import Photos** control instead copies selected files into `assets/products/` and creates draft records. The original file in this inbox remains intact.

## Add a photo to the catalog

1. Start the local server from the repository root in PowerShell:

   ```powershell
   cd "$env:USERPROFILE\Documents\quarterbitgamesSTORE"
   git pull --ff-only origin main
   py -m http.server 8000
   ```

2. Open `http://localhost:8000/admin.html` in Chrome or Edge.
3. Select the local repository root folder—the folder containing `index.html`, `admin.html`, `data/`, and `assets/`.
4. Select **Scan Photo Folders**, then choose a photo, or use **Import Photos** to copy a batch into `assets/products/`.
5. Set the item type and listing details, then save the draft in `data/catalog.json`.
6. When the listing is ready, set it to **Available** and **Published** and add its checkout URL.
7. Review and push the changed catalog file and any new photos to GitHub.

Keep one photo per one-of-a-kind item and retain the filename so its item ID stays stable.