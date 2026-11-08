# Source provenance

The original public HTML was captured from https://omerdavidian.com on November
8, 2026. `original.html` is retained locally and excluded from Git. It is a public
page snapshot, not a WordPress database, form-entry export or full-site backup.

`assets.json` maps original asset URLs to locally stored files. CSS and font
assets that rejected ordinary downloads were recovered from the browser's
rendered original page. Existing theme/font license comments remain in the
vendored files. No WordPress executable code or plugin scripts are deployed.

The migrated HTML is maintained directly in `public/index.html`. It includes the
original text and photographs, with native galleries replacing slider plugins.
Run `python scripts/audit.py` to check the active asset graph. Historical optional
theme decorations in `assets.json` are not necessarily referenced by the site.

Private DNS inventory and operational screenshots are in `private-backup/`,
outside the repository and deployment package.
