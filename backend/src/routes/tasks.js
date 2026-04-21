const { Router } = require('express');
const { z } = require('zod');
const { validate } = require('../middleware/validate');
const {
  getTasks, createTask, updateTask, deleteTask,
} = require('../controllers/tasksController');

const router = Router();

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const updateTaskSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

router.get('/',       getTasks);
router.post('/',      validate(createTaskSchema), createTask);
router.put('/:id',    validate(updateTaskSchema), updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
