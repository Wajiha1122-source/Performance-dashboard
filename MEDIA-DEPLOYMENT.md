# Gallery attachments and visible team progress

Team employee-detail pages now show progress and its date filters immediately, without the Progress toggle. The employee's own dashboard retains its existing collapsible progress section.

Chat supports one photo or video per media message, up to 10 MB (JPG, PNG, GIF, WebP, MP4, WebM). Select Add photo / video, choose a file, then Send media. Text and voice drafts remain separate. Both participants can preview and download the saved attachment; downloads require authentication and conversation membership. Files are stored in PostgreSQL, not temporary server storage. Existing messaging permissions remain unchanged.

## Required before deployment

The database migration has now been applied to the configured database after confirming all three media columns were missing. Existing messages were preserved. For other environments, run `node server/scripts/migrate-message-media.mjs` before deploying the updated server. Deploying the server without these columns breaks chat queries. Deploy the latest client to show the compact single-row attachment, message, microphone and send controls.

## Checks

The expanded integration test is `node server/scripts/check-messages.mjs`. It creates temporary test accounts, tests text, voice and two-way gallery delivery, sender/recipient downloads, duplicate retries and unauthorized access, and removes its test accounts afterward. These checks passed against the local API and configured database after the migration. The frontend production build passed. Browser playback and the deployed API have not been separately verified in this change.

For UI acceptance, open an employee from Team progress and confirm filters/tasks appear without a toggle; then send a photo and video in both directions, preview and download each, and compare downloaded files with originals. Verify failed uploads retain the selected file for retry and that existing text/voice messages still work.
