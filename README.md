# PostCare

PostCare is a responsive, patient-controlled personal health record application. It gives adults one account for organizing appointments, medications, health details, records, documents, and specialists across primary care, dental, vision, hospitals, pharmacies, and other healthcare providers.

**Live application:** [americanpostcare.com](https://americanpostcare.com)

> PostCare is under active development and is not a substitute for professional medical advice, diagnosis, treatment, or emergency services. Do not use the development environment for real protected health information.

## Current features

- Email/password and Google authentication through Supabase
- Account-scoped data that persists between sessions
- Dashboard with health summaries and recent activity
- Appointment creation, editing, deletion, and calendar export (`.ics`)
- Medication tracking
- Conditions and allergy tracking
- General health profile management
- Health record creation and editing
- Document upload and retrieval
- Specialist directory and care-area organization
- Search across saved health information
- Shareable health summaries and data export
- Account settings, recovery, and deletion-request workflows
- Responsive desktop, tablet, and mobile layouts

Calendar files work with Google Calendar, Apple Calendar, Microsoft Outlook, and other applications that support the iCalendar format.

## Technology

- React 19 and TypeScript
- Next-compatible Vinext application structure
- Vite and Cloudflare Workers
- Cloudflare D1 with Drizzle ORM
- Cloudflare R2 object storage
- Supabase Authentication
- Tailwind CSS utilities and project CSS

## Project structure

```text
app/
  api/                 Server endpoints for PostCare data and workflows
  components/          Dashboard, forms, views, navigation, and settings
  lib/                 Shared types, authentication, demo helpers, and calendar export
  share/               Token-based shared-summary page
db/                    Database access, authorization, auditing, and schema
drizzle/               Versioned D1 database migrations
docs/                  Architecture, security, and development documentation
public/                Static application assets
scripts/               Build and validation helpers
tests/                 Automated rendered-output tests
worker/                Cloudflare worker entry point
.openai/hosting.json   Hosted application resource configuration
```

## Run locally

### Requirements

- Node.js 22.13 or newer
- npm

### Setup

```bash
git clone https://github.com/tskovira/PostCare.git
cd PostCare
npm install
npm run dev
```

Open the local URL printed by the development server.

The hosted application depends on configured D1 and R2 bindings. Local development and deployments must use appropriately isolated resources and must never contain production patient data.

## Useful commands

```bash
npm run dev                 # Start the local development server
npm run lint                # Run lint checks
npm test                    # Build and run the automated test suite
npm run build               # Create a production build
npm run db:generate         # Generate a migration after schema changes
npm run validate:artifact   # Validate the built deployment artifact
```

## Data and security model

- API routes resolve the authenticated account on the server.
- Persisted health information is scoped to its owning account.
- Sensitive actions and data changes produce audit events.
- Documents are stored separately from structured database records.
- Public sharing uses revocable tokens rather than exposing account sessions.
- Secrets and local environment files are excluded from version control.

PostCare is still a pre-production application. Handling real medical information requires a formal security program, privacy and regulatory review, vendor agreements where applicable, threat modeling, monitoring, backups, incident response, and comprehensive testing before launch.

## Development direction

Major remaining production milestones include:

1. Complete production security and compliance review.
2. Add stronger session controls, MFA/passkeys, and verified recovery processes.
3. Add document scanning, validation, and processing workers.
4. Expand automated integration, authorization, and accessibility testing.
5. Add standards-based healthcare imports using FHIR/SMART integrations.
6. Add operational monitoring, backup restoration tests, and incident procedures.
7. Complete the scheduled final-deletion worker for expired deletion requests.

## Documentation

- [Technical architecture](docs/technical-architecture.md)
- [Security boundaries](docs/security-boundaries.md)
- [Development roadmap](docs/development-roadmap.md)

## License

No open-source license has been granted. Unless a license is added later, the source code remains copyright-protected and may be viewed through this repository but not reused, modified, or redistributed without permission.
