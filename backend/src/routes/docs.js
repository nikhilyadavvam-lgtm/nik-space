const { Router } = require('express');
const { z } = require('zod');
const { validate } = require('../middleware/validate');
const { getDocs, createDoc, deleteDoc } = require('../controllers/docController');

const router = Router();

const createDocSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  imageUrl: z.string().url('Invalid image URL'),
  category: z.enum(['document', 'personal', 'partner', 'other']).optional(),
});

router.get('/', getDocs);
router.post('/', validate(createDocSchema), createDoc);
router.delete('/:id', deleteDoc);

module.exports = router;
