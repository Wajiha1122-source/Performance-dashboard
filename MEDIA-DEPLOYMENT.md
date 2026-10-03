# Gallery attachments and visible team progress

Team employee-detail pages now show progress and its date filters immediately, without the Progress toggle. The employee's own dashboard retains its existing collapsible progress section.

Chat supports one photo or video per media message, up to 10 MB (JPG, PNG, GIF, WebP, MP4, WebM). Select Add photo / video, choose a file, then Send media. Text and voice drafts remain separate. Both participants can preview and download the saved attachment; downloads require authentication and conversation membership. Files are stored in PostgreSQL, not temporary server storage. Existing messaging permissions remain unchanged.

## Required before deployment

The database migration was NOT applied: the database command was declined. Run `node server/scripts/migrate-message-media.mjs` with access to the intended database before deploying the updated server. It adds three columns without removing existing messages. Then deploy the server and client together. Deploying the server without these columns will break chat queries.

## Checks

The expanded integration test is `node server/scripts/check-messages.mjs`. It creates temporary test accounts, tests text, voice and two-way gallery delivery, sender/recipient downloads, duplicate retries and unauthorized access, and removes its test accounts afterward. It needs the migration and database access. The gallery integration checks have not been run against the database in this change.

For UI acceptance, open an employee from Team progress and confirm filters/tasks appear without a toggle; then send a photo and video in both directions, preview and download each, and compare downloaded files with originals. Verify failed uploads retain the selected file for retry and that existing text/voice messages still work.
