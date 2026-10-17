# Photo drop folder

Drop original product photos in this folder for catalog intake. Keep the filename you want to use as the item ID, such as `HJ-BL-087.jpg` or `Bloomslice-R3.5-004.jpg`.

Files in this folder are an intake inbox. They do not appear on the public storefront by themselves.

## Add them to the catalog

1. Run the repo locally (`python3 -m http.server 8000`) and open `http://localhost:8000/admin.html` in Chrome or Edge.
2. In Admin, select the local repository root folder.
3. Choose the photos from `photos-to-add/`. Admin copies them into `assets/products/` and creates draft catalog records using their filename stems as IDs.
4. Add each listing's details, then review and push the catalog changes with GitHub Desktop.

Keep this inbox as your originals; the catalog uses the copies in `assets/products/`.
