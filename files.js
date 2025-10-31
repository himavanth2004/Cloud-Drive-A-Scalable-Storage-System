const express = require('express');
const router = express.Router();
const AWS = require('aws-sdk');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const upload = multer({ storage: multer.memoryStorage() });

// configure S3 client using env vars (works with MinIO too)
const s3 = new AWS.S3({
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_KEY,
  endpoint: process.env.S3_ENDPOINT,
  s3ForcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
  region: process.env.S3_REGION || 'us-east-1',
});

const BUCKET = process.env.S3_BUCKET || 'cloud-drive';

// simple auth middleware
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'unauthorized' });
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = payload;
    next();
  } catch (e) {
    res.status(401).json({ error: 'invalid token' });
  }
}

router.post('/upload', auth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no file' });
  const key = `${req.user.id}/${uuidv4()}_${req.file.originalname}`;
  try {
    await s3.putObject({
      Bucket: BUCKET,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype
    }).promise();
    res.json({ key });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'upload failed' });
  }
});

router.get('/list', auth, async (req, res) => {
  const prefix = `${req.user.id}/`;
  try {
    const out = await s3.listObjectsV2({ Bucket: BUCKET, Prefix: prefix }).promise();
    const files = (out.Contents || []).map(o => ({ key: o.Key, size: o.Size, lastModified: o.LastModified }));
    res.json({ files });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'list failed' });
  }
});

router.get('/download/:key', auth, async (req, res) => {
  const key = req.params.key;
  // basic check: key must start with user's id
  if (!key.startsWith(`${req.user.id}/`)) return res.status(403).json({ error: 'forbidden' });
  try {
    const out = await s3.getObject({ Bucket: BUCKET, Key: key }).promise();
    res.setHeader('Content-Type', out.ContentType || 'application/octet-stream');
    res.send(out.Body);
  } catch (err) {
    console.error(err);
    res.status(404).json({ error: 'not found' });
  }
});

router.delete('/delete/:key', auth, async (req, res) => {
  const key = req.params.key;
  if (!key.startsWith(`${req.user.id}/`)) return res.status(403).json({ error: 'forbidden' });
  try {
    await s3.deleteObject({ Bucket: BUCKET, Key: key }).promise();
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'delete failed' });
  }
});

module.exports = router;
