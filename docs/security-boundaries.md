# PostCare Security Boundaries

## Status

This document defines engineering boundaries for the prototype-to-product transition. It is not a legal compliance certification or a substitute for a professional threat model, privacy assessment, penetration test, or regulatory review.

## 1. Protected assets

- Account identity and recovery information
- Clinical and dental records
- Medication, allergy, condition, and procedure data
- Mental and behavioral health information
- Uploaded documents and images
- Insurance and claims information
- Emergency contacts
- Consents and sharing grants
- Audit and security events
- Encryption keys, service credentials, and signing keys

## 2. Trust boundaries

### Browser boundary

The browser is untrusted. Client-side validation improves usability but never replaces API validation or authorization. No hidden field, route, identifier, or interface state grants access.

### Identity boundary

Authentication confirms an identity. PostCare authorization separately determines which patient and action that identity may access. A valid token is not blanket access to records.

### API boundary

Every protected request must resolve the authenticated actor, patient context, action, resource, and applicable policy. The API denies by default.

### Database boundary

Application queries include patient scope. Database roles use least privilege. Database constraints and, where practical, row-level controls provide defense in depth rather than replacing application authorization.

### Document boundary

Uploaded content is hostile until validated and scanned. Quarantine workers cannot grant themselves general patient-record access. Document bytes and searchable metadata have separate access paths.

### Integration boundary

Every external connection receives the minimum scopes needed. Tokens are encrypted and separated by user and connection. Imported information is validated, source-labeled, and idempotently reconciled.

### Operator boundary

Support and engineering personnel do not receive routine access to patient contents. Exceptional access is time-bound, purpose-limited, strongly authenticated, approved where required, and visible in audit records.

## 3. Authorization rule

Every decision evaluates:

```text
allow(actor, action, resource, patient, context, policy)
```

The decision must fail closed when identity, patient ownership, consent, resource state, or policy information is missing.

### Initial adult-only rule

For the first release, the authenticated user and patient owner are the same person. This simplifies the initial policy without embedding an assumption that prevents future dependent or caregiver relationships.

## 4. Data separation

- Every patient-owned entity has an immutable patient identifier.
- Public identifiers are not database authorization predicates.
- Cross-patient joins require an explicitly approved operational purpose.
- Logs, metrics, analytics, and traces exclude record contents by default.
- Search indexes contain only explicitly approved fields and preserve patient scope.
- Backups receive equal or stronger protection than active data.

## 5. Record integrity

- Imported clinical records are immutable source versions.
- Patients add annotations or correction flags rather than silently changing source records.
- Patient-entered records retain revision history.
- System-derived values identify the algorithm, version, inputs, and generation time.
- Deletion and archival semantics are explicit and audited.
- Critical state changes use optimistic concurrency or equivalent conflict detection.

## 6. Authentication baseline

- Managed OpenID Connect provider
- Phishing-resistant authentication offered and encouraged
- MFA required for sensitive account actions
- Recent authentication required for exports, deletion, recovery changes, and future sharing
- Rotating, revocable sessions
- Device and session visibility
- Rate-limited authentication and recovery flows
- Recovery designed to resist support-assisted account takeover
- No security questions based on discoverable personal facts

## 7. Document controls

- Allowlist supported types
- Verify magic bytes and detected MIME type
- Enforce size, count, and decompression limits
- Quarantine before access
- Scan for malware
- Render previews in isolation
- Use randomized server-side object keys
- Encrypt stored objects
- Use short-lived, actor-bound authorization for upload and download
- Prevent active content execution
- Audit upload, download, rejection, and deletion events

## 8. Security logging

Log:

- Authentication success and failure
- Session creation and revocation
- Record and document access at the required policy level
- Creation, update, archival, export, and deletion
- Consent and permission changes
- Administrative access
- Integration authorization and token lifecycle events
- Security-control failures

Do not log:

- Full clinical notes
- Document contents
- Access tokens
- Session secrets
- Passwords or recovery secrets
- Unnecessary query parameters containing health information

## 9. High-risk operations

The following require recent authentication, explicit confirmation, rate limiting, audit logging, and asynchronous notification where appropriate:

- Export all data
- Delete account
- Change recovery method
- Add or remove a strong authenticator
- Revoke all sessions
- Create or broaden a future sharing grant
- Connect a provider or payer
- Reveal emergency information outside the authenticated application

## 10. Development controls

- Synthetic data only in local, test, and preview environments
- Secrets stored outside source control
- Protected branches and required reviews
- Dependency and secret scanning
- Static analysis and type checking
- Authorization tests for every protected resource type
- Negative tests for cross-patient access
- Migration review and rollback planning
- Reproducible builds
- Separate production access roles
- Documented incident-response exercises before public launch

## 11. Verification standard

PostCare should use the current OWASP Application Security Verification Standard as the application-security control checklist, supplemented by healthcare-specific privacy, operational, and legal requirements. FAPI 2.0 provides useful high-security OAuth guidance for sensitive API scenarios; any production adoption must be based on a documented threat model and compatible identity-provider support.

## 12. Required threat-model scenarios

- Credential stuffing and account takeover
- Recovery-flow abuse
- Cross-patient object access
- Malicious document upload
- Stored and reflected script injection
- Server-side request forgery in document or integration processing
- OAuth redirect and token theft
- Compromised provider connector
- Insider and exceptional-support access
- Audit-log tampering
- Backup exposure
- Export-link disclosure
- Duplicate or mismatched patient records
- Malicious or incorrect OCR extraction
- Queue replay and repeated imports
- Dependency or CI/CD compromise

## 13. Release gate for real health information

Real health information is prohibited until PostCare has, at minimum:

- Qualified privacy and healthcare legal review
- Vendor and data-flow inventory
- Approved threat model
- Documented security architecture
- Completed access-control testing
- Backup restoration evidence
- Incident-response plan
- Breach-response procedure
- Vulnerability-management process
- Independent penetration-testing plan
- Reviewed privacy policy and terms
- Support access and account-recovery procedures
- Tested export and deletion behavior

