# PostCare

PostCare is a responsive, patient-controlled personal health record application. It gives users one account for organizing appointments, medications, health details, records, documents, and specialists across primary care, dental, vision, hospitals, pharmacies, and other healthcare providers.

**Website:** [americanpostcare.com](https://americanpostcare.com)

> PostCare is not a substitute for professional medical advice, diagnosis, treatment, or emergency services.

## Current features

- Email/password and Google authentication through Supabase
- Account-scoped data that persists between sessions
- Dashboard with health summaries and recent activity
- Appointment creation, editing, deletion, and calendar export
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

## Data and security model

- API routes resolve the authenticated account on the server.
- Persisted health information is scoped to its owning account.
- Sensitive actions and data changes produce audit events.
- Documents are stored separately from structured database records.
- Public sharing uses revocable tokens rather than exposing account sessions.
- Secrets and local environment files are excluded from version control.

## Documentation

- [Technical architecture](docs/technical-architecture.md)
- [Security boundaries](docs/security-boundaries.md)
- [Development roadmap](docs/development-roadmap.md)

## License

No open-source license has been granted. Unless a license is added later, the source code remains copyright-protected and may be viewed through this repository but not reused, modified, or redistributed without permission.
