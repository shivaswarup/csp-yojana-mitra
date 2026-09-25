# Security Specification for Yojana Mitra

## 1. Data Invariants & Authorization Boundaries
1. **User Identity Boundary**: A citizen profile (`/users/{userId}`) can only be created, read, or modified by the authenticated owner whose `request.auth.uid == userId`.
2. **Subcollection Inheritance (Master Gate)**: Subcollections `/users/{userId}/appliedSchemes/{applicationId}` and `/users/{userId}/notifications/{notificationId}` strictly require that the caller matches `request.auth.uid == userId`.
3. **Immutability of Key Identity Fields**: Fields such as `id`, `userId`, `email`, and `createdAt` cannot be hijacked or altered during `update` operations.
4. **Denial-of-Wallet & Injection Guards**: All string fields are constrained by length boundaries (`size() <= maxLength`), IDs are constrained by `isValidId()`, and unbounded collections or rogue payload fields are rejected.
5. **Strict Status Logic**: Applications have bounded valid statuses (`['Not Applied', 'Applied', 'Under Review', 'Approved', 'Rejected']`).
6. **Default Deny Catch-All**: Any unspecified collection or path is strictly rejected by the global default deny rule (`match /{document=**} { allow read, write: if false; }`).

## 2. The "Dirty Dozen" Payloads (Adversarial Test Payloads)
1. **Unauthenticated Read on Profile**: An unauthenticated user attempts to read `/users/user123`. -> *Expected: PERMISSION_DENIED*
2. **Cross-Citizen Profile Read**: Authenticated user `user_attacker` tries to read `/users/user_victim`. -> *Expected: PERMISSION_DENIED*
3. **Identity Spoofing Profile Creation**: Authenticated user `user_attacker` creates profile with `id: "user_victim"`. -> *Expected: PERMISSION_DENIED*
4. **Oversized String Injection Attack**: User sends a 2MB string in `name` or `occupation`. -> *Expected: PERMISSION_DENIED*
5. **Ghost Field / Shadow Injection**: User adds rogue admin privilege property `role: "superadmin"`. -> *Expected: PERMISSION_DENIED*
6. **Cross-Citizen Application Injection**: User `userA` attempts to write into `/users/userB/appliedSchemes/app1`. -> *Expected: PERMISSION_DENIED*
7. **Invalid Application Status Injection**: User sends `status: "HACKED_AND_BYPASSED"`. -> *Expected: PERMISSION_DENIED*
8. **Invalid Path ID Injection**: User sends special characters `/users/userA/appliedSchemes/<script>alert(1)</script>`. -> *Expected: PERMISSION_DENIED*
9. **Cross-Citizen Notification Modification**: User `userA` attempts to mark as read `/users/userB/notifications/notif1`. -> *Expected: PERMISSION_DENIED*
10. **Immutable Owner Modification**: User attempts to update `userId` on existing applied scheme record to another user. -> *Expected: PERMISSION_DENIED*
11. **Negative / Arbitrary Income Bounds Bypass**: User attempts to store non-numeric or malicious type in `annualFamilyIncome`. -> *Expected: PERMISSION_DENIED*
12. **Root Collection Hijack**: User attempts to write to an unmodeled top-level collection `/system_configs/auth`. -> *Expected: PERMISSION_DENIED*
