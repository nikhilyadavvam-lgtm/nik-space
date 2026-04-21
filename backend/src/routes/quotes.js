const { Router } = require('express');
const { getQuotes, createQuote, updateQuote, deleteQuote } = require('../controllers/quoteController');

const router = Router();

router.get('/', getQuotes);
router.post('/', createQuote);
router.put('/:id', updateQuote);
router.delete('/:id', deleteQuote);

module.exports = router;
