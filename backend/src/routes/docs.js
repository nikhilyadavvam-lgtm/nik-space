const { Router } = require('express');
const { z } = require('zod');
const { validate } = require('../middleware/validate');
const { getDocs, createDoc, deleteDoc, uploadR2, getPresignedUrl } = require('../controllers/docController');
const multer = require('multer');

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });


const createDocSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  imageUrl: z.string().min(1, 'Image/file content reference is required'),
  category: z.enum(['document', 'personal', 'partner', 'other']).optional(),
  encrypted: z.boolean().optional(),
  storage: z.enum(['cloudinary', 'r2']).optional(),
});

router.get('/', getDocs);
router.post('/', validate(createDocSchema), createDoc);
router.delete('/:id', deleteDoc);

router.post('/upload-r2', upload.single('file'), uploadR2);
router.get('/presigned-url/:key', getPresignedUrl);

module.exports = router;
