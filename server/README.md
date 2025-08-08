# Server

Express server that accepts a PDF, labels JSON and uploads both to Google Drive using a service account.

## Endpoints
- `GET /health` — health check
- `POST /upload` — multipart/form-data with fields:
  - `file`: PDF file
  - `labelsJson`: stringified JSON of key-value labels

Returns IDs and metadata of the uploaded files.