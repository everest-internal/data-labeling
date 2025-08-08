# PDF Labeling Uploader

A simple internal tool to upload PDF documents, label key-value pairs, and store both the PDF and labels JSON in Google Drive.

## Stack
- Server: Node.js, Express, Google Drive API (service account)
- Client: React (Vite), react-pdf

## Setup

### Prerequisites
- Node.js 18+
- Google Cloud project with a Service Account that has Drive API enabled
- A Drive folder ID (optional) to store files in a specific folder

### Server
1. Copy `server/.env.example` to `server/.env` and fill values:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_SERVICE_ACCOUNT_KEY` (paste raw key with newline escapes `\n`)
   - `GOOGLE_DRIVE_FOLDER_ID` (optional)
2. Install deps and run:
   ```bash
   cd server
   npm install
   npm run dev
   ```
   Server runs on `http://localhost:4000`.

### Client
1. Copy `client/.env.example` to `client/.env` and set `VITE_SERVER_URL` to the server URL.
2. Install deps and run:
   ```bash
   cd client
   npm install
   npm run dev
   ```
   App runs on the printed Vite URL (usually `http://localhost:5173`).

## Usage
1. Open the client, choose a PDF.
2. Fill predefined fields; add custom fields as needed.
3. Click "Send to Drive" to upload. The server will upload the PDF and a JSON file containing labels and the uploaded PDF file ID to Google Drive.

## Notes
- CORS origin can be controlled via `CORS_ORIGIN` in server `.env` if needed.
- Service account needs access to the Drive folder. Share the folder with the service account email.
