import dotenv from 'dotenv';
import express from 'express';
import { buildCors } from './cors.js';
import morgan from 'morgan';
import multer from 'multer';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(buildCors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

const uploadDir = path.join(__dirname, 'uploads');
try { fs.mkdirSync(uploadDir, { recursive: true }); } catch {}
const upload = multer({ dest: uploadDir });

function getDriveClient() {
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, '\n');
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  if (!key || !email) {
    throw new Error('Missing Google service account credentials');
  }
  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });
  return google.drive({ version: 'v3', auth });
}

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { body, file } = req;
    if (!file) {
      return res.status(400).json({ error: 'Missing file' });
    }

    const { labelsJson } = body;
    if (!labelsJson) {
      return res.status(400).json({ error: 'Missing labelsJson' });
    }

    const labels = JSON.parse(labelsJson);

    const drive = getDriveClient();

    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    const originalFileName = file.originalname || `document-${Date.now()}.pdf`;

    const pdfMetadata = {
      name: originalFileName,
      mimeType: 'application/pdf',
      parents: folderId ? [folderId] : undefined,
    };

    const pdfMedia = {
      mimeType: 'application/pdf',
      body: fs.createReadStream(file.path),
    };

    const pdfResult = await drive.files.create({
      requestBody: pdfMetadata,
      media: pdfMedia,
      fields: 'id, name, webViewLink, webContentLink',
    });

    const pdfFileId = pdfResult.data.id;

    const labelFileName = `${path.parse(originalFileName).name}-${uuidv4()}.json`;

    const labelMetadata = {
      name: labelFileName,
      mimeType: 'application/json',
      parents: folderId ? [folderId] : undefined,
    };

    const tmpLabelPath = path.join(__dirname, 'uploads', labelFileName);
    fs.writeFileSync(tmpLabelPath, JSON.stringify({ labels, pdfFileId }, null, 2));

    const labelMedia = {
      mimeType: 'application/json',
      body: fs.createReadStream(tmpLabelPath),
    };

    const labelResult = await drive.files.create({
      requestBody: labelMetadata,
      media: labelMedia,
      fields: 'id, name, webViewLink, webContentLink',
    });

    fs.unlink(file.path, () => {});
    fs.unlink(tmpLabelPath, () => {});

    res.json({
      pdf: pdfResult.data,
      labels: labelResult.data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Upload failed', details: String(error) });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});