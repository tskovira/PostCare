# PostCare

PostCare is a patient-controlled longitudinal personal health record application. Its goal is to give adults one secure place to organize records from primary care, dental care, vision care, specialists, hospitals, laboratories, pharmacies, and insurers.

This repository currently contains the interactive responsive product prototype. It is real application source code—not a screenshot—but it intentionally uses synthetic data and does not yet store medical records.

## Current prototype

- Responsive patient dashboard
- Unified health timeline
- Dental specialty dashboard
- Structured-record categories
- Document center
- Desktop navigation
- Mobile navigation and responsive layouts
- Synthetic medical, dental, appointment, provider, and document data

## Technology

- React 19
- TypeScript
- Vinext/Next-compatible application structure
- Vite
- Tailwind CSS utilities plus project CSS
- Cloudflare-compatible server build

## Project structure

```text
app/
  globals.css       Product styling and responsive layout
  layout.tsx        Application metadata and root HTML layout
  page.tsx          Current interactive PostCare prototype
db/
  index.ts          Future database connection layer
  schema.ts         Future structured data schema
public/             Static assets
scripts/            Build, validation, and local-environment helpers
.openai/hosting.json  Hosted prototype configuration
package.json        Dependencies and development commands
```

## Run locally

### Requirements

- Node.js 22.13 or newer
- npm

### Setup

```bash
npm install
npm run dev
```

Open the local address printed by the development server.

### Production build

```bash
npm run build
```

## Prototype boundaries

The current version is a UX and product prototype:

- Data is hard-coded and synthetic.
- Buttons demonstrate navigation but do not yet save records.
- There is no production patient database.
- There is no document-upload pipeline.
- There are no provider or insurance integrations.
- It must not be used for actual health information.

## Planned engineering stages

1. Separate the current interface into reusable components and routes.
2. Define the authorization, provenance, and consent models.
3. Design a FHIR-compatible clinical data model.
4. Add a secure backend API and relational database.
5. Add production authentication and session management.
6. Build the encrypted document-upload and malware-scanning pipeline.
7. Add audit history, export, and deletion workflows.
8. Test with synthetic data before any controlled real-user pilot.

## Security

Do not place real patient or medical information in the prototype. A public release that stores health information will require professional legal, privacy, security, and regulatory review in addition to the technical controls described in the product requirements.

## Product documentation

The project is supported by separate living documents covering:

- Product charter
- Product requirements
- UX architecture
- Future authorization and provenance design
- Future system architecture and threat model

