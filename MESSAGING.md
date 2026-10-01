# Private employee–CEO messaging

The Messages sidebar opens private text and voice conversations. Employees see active CEO accounts; CEOs see active employees sorted by department. Existing progress and comments are separate.

## Deployment

Run `node scripts/migrate-messages.mjs` from `server` with the configured database. This migration is additive and has already been applied to the configured database during implementation. Deploy **both** the Express backend and Vite frontend. Existing login credentials are unchanged.

Voice clips are stored as private PostgreSQL bytea data, not local server files, so redeploys do not remove recordings. Limits: two minutes and 2 MB per clip; text is limited to 4,000 characters. Recording requires microphone permission and HTTPS (or localhost). Supported recording formats depend on the browser: WebM, Ogg, or MP4.

Conversations poll for new messages every two seconds while visible and immediately on returning to the tab. Contact unread totals refresh every five seconds and after read receipts. Successfully sent messages appear immediately with recipient confirmation. Read receipt failures do not hide incoming messages. Chat limits are per authenticated user, with a separate broad network limit, to accommodate shared office connections. Notifications are inside the portal; there are no push or email notifications. Earlier messages load in pages of fifty. Sent messages are retained until an account is deleted; user deletion cascades to associated messages. No automatic retention expiry is configured.

All message and audio routes validate active accounts in PostgreSQL and require an employee–CEO pair. Audio downloads require the current Bearer token and are fetched as private browser blob URLs. Audio bytes are never returned in message lists. Failed sends keep the draft; client request IDs prevent duplicate submissions on retry.

## Verification

`node scripts/check-messages.mjs` from `server` creates temporary verification accounts and cleans them up. It covers text sending, idempotency, employee isolation, unread/read behavior, audio storage and access, invalid input, and inactive accounts. It does not exercise a real microphone or browser codec playback. `npm run build --prefix client` checks the frontend build.
