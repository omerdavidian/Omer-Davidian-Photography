# Photography migration and rollback

## Accounts and resources

- Vercel account: omerdavidian@gmail.com.
- Project: omer-davidians-projects/omer-davidian-photography.
- Cloudflare zone: 7a314e7f9786fcd6a2eed5681f2397a6.
- Nameservers: sonia.ns.cloudflare.com and woz.ns.cloudflare.com.
- Resend account: omerdavidian+photography@gmail.com.
- Resend sending subdomain: contact.omerdavidian.com.
- Upstash free resource: photography-abuse-limit; automatic paid upgrade disabled.

## Completed preparation

The full visible HostGator DNS table contained 23 records. It was saved in
`private-backup/hostgator-dns-before.md` and `hostgator-dns-rows.json`, excluded
from Git. All 23 were copied to Cloudflare and compared before changing
nameservers. HostGator confirmed the nameserver save on November 8, 2026.

The original nameservers were hgns1.hostgator.com and hgns2.hostgator.com.
Original apex/www A address: 192.254.224.254. Mail A remains 192.254.224.254,
with MX priority 0 pointing to mail.omerdavidian.com. Existing SPF, DKIM, DMARC,
verification and service records were retained. Resend records are isolated
under the contact subdomain and do not change incoming mail.

Vercel returned this project-specific preferred CNAME destination:
`00537dc69cea097d.vercel-dns-017.com`. Refresh Vercel's domain configuration
immediately before the website cutover. Use DNS-only records and Cloudflare's
apex flattening. Do not point mail, webmail or other existing services at Vercel.

## Before declaring launch complete

1. Verify Cloudflare zone activation and authoritative DNS responses.
2. Verify Resend sending domain and configure a domain-restricted sending key.
3. Deploy with production form settings, test a real inquiry through the browser,
   and confirm delivery in Resend and the owner's mailbox.
4. Update only apex and www website records to the returned Vercel target.
5. Verify valid HTTPS, custom-domain form, navigation, galleries, mobile layout,
   security headers, old section hashes, and existing mail DNS.
6. Keep the HostGator WordPress site and mail hosting. No cancellation or mailbox
   migration is included. A public HTML/media snapshot is not a full WordPress
   database or mailbox backup; obtain those before retiring the old hosting.

## Rollback

Restore the Cloudflare apex/www A records to 192.254.224.254 to serve the old
WordPress origin while retaining Cloudflare DNS. Alternatively restore the
original HostGator nameservers; the original HostGator zone was not edited.
Do not remove mail-related records. Resend subdomain records can remain without
changing the old website or mailbox. Registration remains with HostGator.

## Current verification status

Nameserver save and public Cloudflare delegation verified; all original records
copied. Website cutover, final mail delivery and launch checks are in progress.
