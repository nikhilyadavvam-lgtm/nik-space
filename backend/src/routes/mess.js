const { Router } = require('express');
const { getMealPlan, saveMealPlan } = require('../controllers/messController');

const router = Router();

router.get('/', getMealPlan);
router.post('/', saveMealPlan); // We'll skip complex zod validation for nested map for now

module.exports = router;
