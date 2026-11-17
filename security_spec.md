# Security Specification — EcoTrack V22

## 1. Data Invariants
1. **Strict Ownership Isolation**: Every household profile, monthly carbon audit, daily habit check-in, abatement plan, and security recovery record lives under `/users/{userId}/...` and belongs strictly to `request.auth.uid == userId` with `request.auth.token.email_verified == true`.
2. **Immutable Ownership & Timestamps**: `uid` and `createdAt` can never be reassigned after creation; `createdAt` on create and `updatedAt` on create/update must equal `request.time`.
3. **Bounded Payloads**: All strings enforce explicit `.size()` maxima matching `firebase-blueprint.json`, IDs match `^[a-zA-Z0-9_\-]+$`, numeric activity streams are bounded within physically plausible non-negative ranges, arrays are strictly capped (`<= 10` habits, `<= 24` abatement IDs), and security recovery stores only a 64-char SHA-256 hex digest (`answerHash`), never plaintext answers.
4. **No Shadow Fields**: Both `create` (`hasAll` + `hasOnly`) and `update` (`affectedKeys().hasOnly`) reject unexpected or injected keys.

## 2. Adversarial Test Payloads ("Dirty Dozen")
1. Cross-user profile read (`GET /users/other_uid/profile/household`) -> `PERMISSION_DENIED`
2. Unverified email write (`POST /users/uid/profile/household` with `email_verified: false`) -> `PERMISSION_DENIED`
3. UID spoofing in audit create (`uid: "victim_uid"`) -> `PERMISSION_DENIED`
4. Shadow field injection (`isAdmin: true` or `role: "superadmin"`) -> `PERMISSION_DENIED`
5. Oversized string DoS (`notes` > 400 chars or `householdName` > 80 chars) -> `PERMISSION_DENIED`
6. Invalid document ID path poisoning (`auditId: "../../admin"` or 200-char ID) -> `PERMISSION_DENIED`
7. Client-forged timestamp (`createdAt` != `request.time`) -> `PERMISSION_DENIED`
8. Mutating immutable `createdAt` on audit update -> `PERMISSION_DENIED`
9. Negative emission stream injection (`electricityKwh: -500`) -> `PERMISSION_DENIED`
10. Unbounded array attack (`completedIds` with 50 items) -> `PERMISSION_DENIED`
11. Unbounded type confusion inside array (`completedIds: [12345]`) -> `PERMISSION_DENIED`
12. Cross-user collection `list` scraping without owner equality -> `PERMISSION_DENIED`
