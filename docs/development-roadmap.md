# PostCare Development Roadmap

## Current state

PostCare has a validated product concept, requirements document, UX blueprint, responsive interactive prototype, hosted review build, and public source repository. The prototype uses synthetic data and does not yet persist records.

## Phase 1 — Maintainable frontend foundation

### Deliverables

- Route-based screen structure
- Reusable application shell
- Shared design tokens and components
- Typed synthetic fixtures
- Accessible form components
- Unit and interaction tests
- Loading, empty, error, and denied states

### Exit criteria

- No major screen is defined in one monolithic file.
- Navigation works through stable URLs.
- Synthetic data can be replaced by an API without rewriting screen components.
- Core keyboard and responsive behaviors are tested.

## Phase 2 — Identity and patient foundation

### Deliverables

- Managed authentication
- User and patient profile model
- Session and device management
- Server-side authorization middleware
- Security-event pipeline
- Protected application routes

### Exit criteria

- Every protected API operation has an authorization test.
- Cross-user access tests fail closed.
- Sensitive account actions require recent authentication.

## Phase 3 — First persistent clinical workflows

### Deliverables

- PostgreSQL schema and migrations
- Providers
- Appointments
- Conditions
- Medications
- Allergies
- Sources and provenance
- Unified timeline API

### Exit criteria

- A user can create, edit, archive, and review patient-entered records.
- Original source and revisions remain traceable.
- Retryable writes are idempotent.
- Timeline results are paginated and correctly patient-scoped.

## Phase 4 — Protected document pipeline

### Deliverables

- Quarantined upload flow
- Validation and malware scanning
- Encrypted protected storage
- Document metadata
- Record associations
- Safe previews
- Download authorization

### Exit criteria

- No file becomes readable before approval.
- Unsafe types and oversized objects are rejected.
- Every document access is authorized and audited.

## Phase 5 — Trust and user control

### Deliverables

- User-visible access history
- Data export
- Account deletion workflow
- Correction flags and annotations
- Consent version history
- Operational monitoring and alerting

### Exit criteria

- Users can understand where each item came from.
- Export and deletion are tested end to end.
- Administrative access is exceptional and visible.

## Phase 6 — Interoperability

### Deliverables

- FHIR R4 sandbox client
- SMART App Launch authorization
- Provider and payer connection model
- Import reconciliation
- Connection revocation
- Connector-specific versioning and conformance tests

### Exit criteria

- Imported resources retain their source and identifiers.
- Repeated imports do not create uncontrolled duplicates.
- Revoked connections can no longer retrieve data.

## Phase 7 — Controlled pilot readiness

### Deliverables

- Legal and privacy review
- Threat model and independent security testing
- Incident and breach runbooks
- Backup restoration exercise
- Support and recovery procedures
- Pilot analytics without record contents
- Invite-only onboarding

### Exit criteria

- Formal approval to accept limited real-user information
- Named owners for security, privacy, operations, and support
- Tested rollback and incident communication procedures

## Immediate sprint

The next implementation sprint is **Phase 1: Maintainable frontend foundation**. It should preserve the current visual design while replacing the single-file prototype with routes, reusable components, typed fixtures, and automated interaction tests.

