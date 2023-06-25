import Redis from "ioredis"
import { createClient } from '@vercel/kv';

const client = createClient({
    url: process.env.REDIS_SERVICE_REST_URL,
    token: process.env.REDIS_SERVICE_REST_TOKEN,
});

export default { client };

