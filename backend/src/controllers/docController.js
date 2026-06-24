const Doc = require('../models/Doc');

exports.getDocs = async (req, res) => {
  try {
    const docs = await Doc.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ docs });
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching documents' });
  }
};

exports.createDoc = async (req, res) => {
  try {
    const { name, imageUrl, category, encrypted, storage } = req.body;
    const normalizedCategory = ['document', 'personal', 'partner', 'other'].includes(category)
      ? category
      : 'document';

    const doc = new Doc({
      userId: req.userId,
      name,
      imageUrl,
      category: normalizedCategory,
      encrypted: encrypted || false,
      storage: storage || 'cloudinary',
    });
    await doc.save();
    res.status(201).json({ doc });
  } catch (error) {
    res.status(500).json({ error: 'Server error creating document' });
  }
};

exports.deleteDoc = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Doc.findOneAndDelete({ _id: id, userId: req.userId });
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json({ message: 'Document deleted successfully', docId: id });
  } catch (error) {
    res.status(500).json({ error: 'Server error deleting document' });
  }
};

const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

let r2Client = null;
function getR2Client() {
  if (r2Client) return r2Client;

  const endpoint = process.env.R2_ENDPOINT || '';
  const accessKeyId = process.env.R2_ACCESS_KEY_ID || '';
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';

  r2Client = new S3Client({
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    region: 'auto',
    forcePathStyle: true,
  });

  return r2Client;
}

exports.uploadR2 = async (req, res) => {
  try {
    const file = req.file;
    const { fileName } = req.body;
    
    if (!file || !fileName) {
      return res.status(400).json({ error: 'file and fileName are required' });
    }

    const bucketName = process.env.R2_BUCKET || 'nikspace';

    const client = getR2Client();
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype || 'application/octet-stream',
    });

    await client.send(command);
    res.json({ key: fileName });
  } catch (error) {
    console.error('Backend R2 upload error:', error);
    res.status(500).json({ error: 'Failed to upload to Cloudflare R2 storage' });
  }
};

exports.getPresignedUrl = async (req, res) => {
  try {
    const { key } = req.params;
    if (!key) {
      return res.status(400).json({ error: 'Key is required' });
    }

    const bucketName = process.env.R2_BUCKET || 'nikspace';
    const client = getR2Client();
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const url = await getSignedUrl(client, command, { expiresIn: 3600 });
    res.json({ url });
  } catch (error) {
    console.error('Backend R2 presign error:', error);
    res.status(500).json({ error: 'Failed to generate download URL from R2 storage' });
  }
};
