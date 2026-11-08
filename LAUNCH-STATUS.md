# Launch result — November 8, 2026

- URL: https://omerdavidian.com (also https://www.omerdavidian.com).
- Target: production; status READY.
- Deployed source commit: 2a3695d.
- Vercel deployment: dpl_2MzhR5SjrkHbSeKQRQGtSfT7LWqB.
- Framework: static HTML/CSS/JavaScript with Node.js 22 Vercel functions.
- Build duration: approximately 2 seconds, as reported in Vercel's build output.
- Account: omerdavidian@gmail.com, Omer Davidian's projects.
- Source: C:/Coding/Omer Davidian Photography.
- Repository: https://github.com/omerdavidian/Omer-Davidian-Photography.

## Verified behavior

The original branding, photography, sidebar, fonts, background colors, section
order and full-width banners remain. The old loading overlay and WordPress
plugin runtime are removed. Galleries have native controls and an accessible
image dialog; mobile navigation, before/after comparison and contact inputs are
usable at 390px without horizontal page overflow. The hero uses manual controls
instead of the previous animated text and automatic slideshow.

Ten automated form/security tests pass. The local asset audit checks 360 active
references with no missing files; 117 image elements are in the portfolio.
Both custom-domain hosts return HTTPS 200 with CSP, HSTS, frame protection,
content-type protection and privacy-related browser headers. WordPress admin
and executable plugin code are absent from the deployment.

The approved real inquiry ODP-04000985 was accepted through the deployed browser
form, marked delivered by Resend, and found in the owner's Gmail inbox. Reusing
its Turnstile token returned 400. A custom-domain invalid-token probe also
returned 400. Both domain hosts report the form ready; the live custom-domain
mobile browser completed the automatic challenge successfully.

## DNS and mail

Cloudflare zone is active. The apex and www records use the exact Vercel-provided
CNAME target with proxy disabled. Vercel confirms both domains verified and DNS
correctly configured. The full original 23-record zone was copied and compared
before switching nameservers. Only the two website targets changed afterward;
three Resend records were added under contact.omerdavidian.com.

Inbound MX, mail A, SPF, DKIM, DMARC and other existing services remain on their
original targets. Registration remains with HostGator. Old hosting and mailbox
data have not been deleted or cancelled. Recursive caches may retain the former
website address until its original two-hour TTL expires.

## Operations and limits

- Runtime error scan: no entries found in the post-launch Vercel error-log scan.
- Separate monitoring drains: not configured for this migration.
- Inquiry archive: delivered owner emails; no separate inquiry database.
- Upstash plan: free, with automatic paid upgrades disabled.
- Resend key: sending-only, restricted to contact.omerdavidian.com, stored in
  Vercel server settings. Turnstile secret and Redis credentials are server-only.
- Git automatic deployment is not connected; reviewed releases use the Vercel
  CLI in the verified photography account. The repository is up to date.
- Obtain full WordPress database/files and any needed mailbox backups before
  retiring HostGator. The public HTML/media snapshot is not a full backup.

See CUTOVER.md for DNS rollback and README.md for local development.
