const { Router } = require('express');
const { z } = require('zod');
const { validate } = require('../middleware/validate');
const {
  getChats, getChat, createChat, addMessage, deleteChat, updateChat, updateMessage, deleteMessage
} = require('../controllers/chatController');

const router = Router();

const createChatSchema = z.object({
  title: z.string().optional(),
});

const updateChatSchema = z.object({
  title: z.string().optional(),
  icon: z.string().optional(),
  description: z.string().optional(),
});

const addMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().optional().default(''),
  imageUrl: z.string().url().nullable().optional(),
}).superRefine((data, ctx) => {
  if (!data.content.trim() && !data.imageUrl) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['content'],
      message: 'Content or image is required',
    });
  }
});

router.get('/',             getChats);
router.get('/:id',          getChat);
router.post('/',            validate(createChatSchema), createChat);
router.put('/:id',          validate(updateChatSchema), updateChat);
router.post('/:id/messages', validate(addMessageSchema), addMessage);
router.put('/:id/messages/:messageId', updateMessage);
router.delete('/:id/messages/:messageId', deleteMessage);
router.delete('/:id',       deleteChat);

module.exports = router;
