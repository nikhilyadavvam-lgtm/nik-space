const { Router } = require('express');
const { z } = require('zod');
const { validate } = require('../middleware/validate');
const {
  getNotes, getNote, createNote, createFolder, updateNote, deleteNote, deleteFolder,
  addChannelMessage, updateChannelMessage, deleteChannelMessage
} = require('../controllers/notesController');

const router = Router();

const createNoteSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPinned: z.boolean().optional(),
  folderId: z.string().optional(),
  type: z.enum(['text', 'chat']).optional(),
});

const updateNoteSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPinned: z.boolean().optional(),
  folderId: z.string().optional(),
});

const createFolderSchema = z.object({
  name: z.string().min(1, 'Folder name is required'),
});

const addMessageSchema = z.object({
  role: z.enum(['user', 'assistant']).optional().default('user'),
  content: z.string().optional().default(''),
  imageUrl: z.string().optional().default(''),
});

// Folder routes
router.post('/folders', validate(createFolderSchema), createFolder);
router.delete('/folders/:id', deleteFolder);

// Channel/Note routes
router.get('/',    getNotes);
router.get('/:id', getNote);
router.post('/',   validate(createNoteSchema), createNote);
router.put('/:id', validate(updateNoteSchema), updateNote);
router.delete('/:id', deleteNote);

// Channel Chat Messages routes
router.post('/:id/messages', validate(addMessageSchema), addChannelMessage);
router.put('/:id/messages/:messageId', updateChannelMessage);
router.delete('/:id/messages/:messageId', deleteChannelMessage);

module.exports = router;
