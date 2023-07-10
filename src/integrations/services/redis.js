import { createClient } from '@vercel/kv';
// const redis = new createClient({
//     url: process.env.REDIS_SERVICE_REST_URL,
//     // token: process.env.REDIS_SERVICE_REST_TOKEN,
// });


import IoRedis from "ioredis"
let redis = new IoRedis(process.env.REDIS_SERVICE_CONNECTION_STRING);

redis.on('ready', () => {
    console.log('Redis client connected');
});

redis.on('error', (err) => {
    console.error('Redis client error:', err);
});

redis.on('end', () => {
    console.log('Redis client disconnected');
});


// export default redis;
module.exports = { redis }