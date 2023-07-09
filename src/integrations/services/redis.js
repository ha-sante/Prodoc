import { createClient } from '@vercel/kv';

const redis = new createClient({
    url: process.env.REDIS_SERVICE_REST_URL,
    token: process.env.REDIS_SERVICE_REST_TOKEN,
});

module.exports = { redis }