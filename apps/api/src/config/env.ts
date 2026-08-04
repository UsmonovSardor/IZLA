import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.string().default('development'),
  API_PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string(),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  JWT_ACCESS_SECRET: z.string().default('dev-access'),
  JWT_REFRESH_SECRET: z.string().default('dev-refresh'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),
  TELEGRAM_BOT_TOKEN: z.string().optional().default(''),
});

export const env = schema.parse(process.env);
export type Env = z.infer<typeof schema>;
