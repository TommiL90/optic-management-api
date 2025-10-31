import { z } from 'zod';

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  timestamp: z.string().datetime(),
  uptime: z.number(),
  version: z.string(),
  environment: z.string(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
