const { Router } = require('express');
const { z } = require('zod');
const { validate } = require('../middleware/validate');
const {
  getNotes, getNote, createNote, updateNote, deleteNote,
} = require('../controllers/notesController');

const router = Router();

const createNoteSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPinned: z.boolean().optional(),
});

const updateNoteSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPinned: z.boolean().optional(),
});

router.get('/',    getNotes);
router.get('/:id', getNote);
router.post('/',   validate(createNoteSchema), createNote);
router.put('/:id', validate(updateNoteSchema), updateNote);
router.delete('/:id', deleteNote);

module.exports = router;
