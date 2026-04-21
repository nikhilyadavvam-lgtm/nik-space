const { Router } = require('express');
const { z } = require('zod');
const { validate } = require('../middleware/validate');
const { getExpenses, createExpense, deleteExpense } = require('../controllers/financeController');

const router = Router();

const createExpenseSchema = z.object({
  amount: z.number().positive(),
  category: z.string().min(1),
  description: z.string().optional(),
  date: z.string().optional(),
});

router.get('/', getExpenses);
router.post('/', validate(createExpenseSchema), createExpense);
router.delete('/:id', deleteExpense);

module.exports = router;
