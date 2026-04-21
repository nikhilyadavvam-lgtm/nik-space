const { z } = require('zod');

/**
 * Creates express middleware that validates req.body against a Zod schema.
 * Usage: router.post('/', validate(mySchema), controller)
 */
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map(i => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    req.body = result.data; // Use parsed/cleaned data
    next();
  };
}

module.exports = { validate };
