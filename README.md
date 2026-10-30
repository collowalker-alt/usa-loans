# MOMO Loans USA
USA-focused loan application portal based on the MOMO Loans Zambia prototype.

## Run locally
```bash
npm install
npm start
```

Set `DATABASE_URL` to a PostgreSQL connection string for persistent application storage. Without it, applications are held in memory for development only and are lost on restart. Set `ADMIN_TOKEN` to enable the protected admin applications endpoint at `/api/admin/applications` (Authorization: Bearer <token>).

## Render
Create a Node web service from this repository. Build command: `npm install`; start command: `npm start`. Add a separate PostgreSQL database and set `DATABASE_URL` on the web service. Set a strong `ADMIN_TOKEN`. Do not use the Zambia database.

## Compliance and privacy
This is an application portal prototype, not a lender or a credit decision system. Before collecting real applicants, confirm legal business identity, lender/broker role, state-by-state licensing, lender-approved terms/disclosures, privacy notice, retention/security controls, and any applicable federal/state requirements. Do not collect SSNs, bank credentials, or payment information through this starter form.