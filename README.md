# Vendor Command Center

Ops-facing communication hub for vendor documentation, onboarding, and performance. This prototype uses a CRM-linked vendor record named **Footwear Vendor**.

## Features

- **Dashboard** — YTD orders/returns (linked to Reporting), top 10 styles pie chart, brand listing + style look up (vendor or service style #), vendor user add/update/remove (with title), intake upload, and compliance checklist with status updates
- **Brand Management** — add/manage brands (name, Brand ID, logo), assign vendor ↔ service style #s, list brands, and export styles as CSV
- **Documents** — library of uploaded files (intake form first)
- **FTP Access** — Host, Username, and Password fields
- **Reporting** — monthly orders and returns
- **Pricing Setup / Style Setup** — placeholder pages

Uploads, vendor users, brands (with logos and style mappings), document status, and FTP credentials persist in this browser (`localStorage` + IndexedDB). No backend or auth.

## Run locally

```bash
npm install
npm run dev -- --port 43125
```

Open [http://127.0.0.1:43125](http://127.0.0.1:43125).

## Stack

Next.js (App Router), TypeScript, Tailwind CSS, and shadcn/ui.
