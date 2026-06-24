const { z } = require('zod');

const envSchema = z.object({
  PORT:            z.string().default('5000'),
  MONGODB_URI:     z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET:      z.string().min(16, 'JWT_SECRET must be at least 16 chars'),
  CLIENT_URL:      z.string().default('http://localhost:8081'),
  MASTER_KEY:      z.string().min(16, 'MASTER_KEY must be at least 16 chars'),
  GROQ_API_KEY:    z.string().optional(),
});

function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Environment validation failed:');
    result.error.issues.forEach(issue => {
      console.error(`   ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
  }
  console.log('✅ Environment variables validated');
  return result.data;
}

module.exports = { validateEnv };
