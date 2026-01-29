# Data Flows, User Rights, and Compliance (GDPR/CASL)

## Data Flows
- The extension collects personal data (names, phone numbers, profile links) from LinkedIn and WhatsApp only after explicit user consent.
- Data is stored locally in the browser's localStorage and can be exported or deleted by the user at any time.
- Data may be sent to a backend server via secure (HTTPS) API calls, only after user consent.
- No data is sent to third parties or used for purposes other than lead management.

## User Rights
- **Consent:** Users must explicitly opt-in before any data is collected, processed, or sent.
- **Revocation:** Users can revoke consent at any time, which deletes all local data and blocks further processing until new consent is given.
- **Export:** Users can export all their stored data in a machine-readable format (JSON) via the UI.
- **Delete/Anonymize:** Users can delete or anonymize all their local data at any time via the UI.
- **Transparency:** Users are shown a privacy policy and terms of use before any data collection.

## Compliance Steps
- All API calls are enforced to use HTTPS for secure data transmission.
- No scraping or data sending is possible without explicit user consent.
- A privacy policy and terms of use modal is shown on first use and must be accepted.
- All data management (export, delete, revoke consent) is available in the extension UI.
- No cookies or tracking are used for advertising or analytics.
- Users are informed that server-side data deletion requires contacting support.

## Contact
For any data or privacy requests regarding server-side data, please contact support at: support@targetiq.io

---
This document is intended to help auditors and users understand how the extension respects privacy and complies with GDPR and CASL requirements.
