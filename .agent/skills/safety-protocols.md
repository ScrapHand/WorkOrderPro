# Skill: Safety Protocols & LOTO

## Context
In industrial maintenance, safety is paramount. LOTO (Lockout/Tagout) is the primary method for ensuring hazardous energy sources are isolated.

## LOTO Configuration
1. **Asset Level**: Assets store LOTO procedures (images and labels) in `lotoConfig`.
2. **Tabbed Isolation**: Procedures are categorized by source: `Electrical`, `Pneumatic`, `Hydraulic`.

## Safety-Critical Workflow (The Sign-off)
1. **Detection**: Any work order on an asset with non-empty `lotoConfig` is flagged as "Safety Critical".
2. **Verification Requirement**: The system must block status transitions from `OPEN` to `IN_PROGRESS` until a `loto_verified` check is recorded.
3. **Audit Trail**: Every LOTO sign-off must record:
   - User ID of the verifier.
   - Timestamp of verification.
   - Snapshot of the current LOTO configuration.

## Implementation Guidelines
- **Frontend**: Force users to view LOTO procedures before they can acknowledge verification.
- **Backend**: Use a dedicated endpoint `POST /work-orders/:id/verify-safety` to record the sign-off event in the `AuditLog` and update the work order state.

## Common Pitfalls
- **Stale Procedures**: Ensure that if LOTO procedures are updated while a work order is open, the user is notified of the change.
- **UI Bypass**: Never rely solely on frontend blocking; enforce the verification check in the backend controller.
