const { Router } = require('express');
const { z } = require('zod');
const { validate } = require('../middleware/validate');
const {
  getVaultEntries, createVaultEntry, updateVaultEntry, deleteVaultEntry,
} = require('../controllers/vaultController');

const router = Router();

const createVaultEntrySchema = z.object({
  accountName: z.string().min(1, 'Account Name is required'),
  password: z.string().min(1, 'Password is required'),
});

const updateVaultEntrySchema = z.object({
  accountName: z.string().optional(),
  password: z.string().optional(),
});

router.get('/', getVaultEntries);
router.post('/', validate(createVaultEntrySchema), createVaultEntry);
router.put('/:id', validate(updateVaultEntrySchema), updateVaultEntry);
router.delete('/:id', deleteVaultEntry);

module.exports = router;
