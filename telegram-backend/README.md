# MyGallery Telegram Storage Backend

This folder is reserved for the secure Telegram integration.

## Security
- Never put the Telegram bot token in frontend JavaScript.
- Store secrets in the deployment platform's environment variables.
- The private Telegram channel remains the media storage destination.

## Planned API
- `POST /api/upload` — upload a photo/video to Telegram and return its media reference.
- `GET /api/media` — list media and folder metadata.
- `POST /api/folders` — create a folder.
- `PATCH /api/media/:id` — move/rename media metadata.
- `DELETE /api/media/:id` — delete media from the storage layer.

The frontend will call this backend rather than exposing the bot token.