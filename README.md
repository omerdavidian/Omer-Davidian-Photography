# Omer Davidian Photography

Code-based migration of the existing WordPress portfolio, preserving its logo,
photography, sidebar, typography, section order, galleries and virtual tour.

## Local development

Requires Node.js 22. No npm runtime dependencies.

```powershell
npm ci
npm run dev
```

The preview prints an available loopback URL. The local server supports the same
contact handlers as Vercel, but the form deliberately stays unavailable without
its delivery and protection settings. To test with locally configured secrets,
use `node --env-file=.env.local scripts/preview.mjs`.

```powershell
npm test
npm run build
python scripts/audit.py
```

The optional asset audit requires Python and BeautifulSoup. Normal builds and
deployments only require Node. `public/` is the maintained site source; `dist/`
is generated. `api/` contains Vercel serverless handlers. The build also writes
`vercel.json`, including CSP, HTTPS and browser security headers.

## Contact form

- Server validates sizes, email, service, and request origin.
- Turnstile tokens must pass server verification, action and hostname checks.
- Upstash enforces a shared limit of five requests per IP hash per ten minutes.
- Resend sends plain-text inquiry mail to the owner, with the visitor as Reply-To.
- Success is shown only after the email provider accepts the message.
- Honeypot, loading/error states, accessible labels, optional telephone and
  direct email/phone alternatives are included.
- No public admin login, WordPress executable code, or WordPress API is deployed.

The form does not maintain a separate inquiry archive. Owner inquiry emails are
the record. Delivery failures retain the visitor's typed message for retry.

Configure `.env.example` names in Vercel. The Upstash Vercel integration supplies
`KV_REST_API_URL` and `KV_REST_API_TOKEN`; equivalent `UPSTASH_REDIS_REST_*` names
are also accepted. Production `TURNSTILE_HOSTNAMES` must list only deployed hosts,
not localhost. Never commit secret files, export keys into client code, or copy
settings from another project.

## Deployment

Vercel project: `omer-davidians-projects/omer-davidian-photography`.
Public staging URL: https://omer-davidian-photography.vercel.app.
Repository: https://github.com/omerdavidian/Omer-Davidian-Photography.

Use the authenticated photography account and verify `vercel whoami` before
deploying. The existing global CLI account may belong to another project. The
isolated account configuration used for this migration lives outside this repo.

Git pushes are not currently connected to Vercel. Deploy reviewed code with
`vercel deploy --prod --scope omer-davidians-projects` using the photography CLI
login. A fresh build should pass all checks first.

See `CUTOVER.md` for DNS changes, verification and rollback. Keep the original
WordPress hosting and existing mail service until both have been independently
verified and backups are complete.
