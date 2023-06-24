import { createClient } from 'redis';

const client = createClient({ url: env.process.REDIS_SERVICE_URL });
export const redis = await client.connect();
