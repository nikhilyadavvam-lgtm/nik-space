const { Router } = require('express');
const { 
  getQuotes, 
  createQuote, 
  updateQuote, 
  deleteQuote,
  getImageQuotes,
  createImageQuote,
  deleteImageQuote
} = require('../controllers/quoteController');

const router = Router();

// Text Quotes
router.get('/', getQuotes);
router.post('/', createQuote);
router.put('/:id', updateQuote);
router.delete('/:id', deleteQuote);

// Image Quotes
router.get('/images', getImageQuotes);
router.post('/images', createImageQuote);
router.delete('/images/:id', deleteImageQuote);

module.exports = router;
