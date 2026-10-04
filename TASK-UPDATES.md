# Task evidence, audit history and colleague chat

- Each new task requires a title from the nine requested categories and a description. Existing task titles are preserved; editing a legacy title requires choosing a category.
- Each new task optionally includes one photo/video up to 2 MB, with a 10 MB attachment total per submission. Task and attachment save in the same transaction. Allowed formats: JPG, PNG, GIF, WebP, MP4, WebM. Attachments are stored privately in PostgreSQL and retrieved with authentication using the same scope as task visibility.
- Submitted-task deletion is rejected by the API, and its button is removed. Unsaved draft rows can still be removed. Own historical tasks remain editable.
- A database trigger records before/after title, description, priority, status and reason only when values change. History starts with this migration; earlier edits cannot be reconstructed. Only the CEO can retrieve edit history. The history control is hidden unless edits exist and remains collapsed until opened.
- All active employees and CEO accounts can privately message one another, excluding themselves. Conversation and download queries remain restricted to the two participants. Department-view grants do not grant access to colleagues' conversations.

## Deployment

The configured database has received `server/database/migrate-task-evidence.sql`. For another database, run `node server/scripts/migrate-task-evidence.mjs` first. Deploy the updated frontend and backend together; these code changes are not deployed by this task. Existing accounts and task records are preserved.

## Verification

Run `node server/scripts/check-messages.mjs` to check colleague chat, chat media, task attachment round trips, scoped media access, title validation, rejected deletion, and CEO-only before/after history. The script creates temporary accounts and removes them afterward. Run the client production build separately. Browser visual/playback checks are separate from API tests.
