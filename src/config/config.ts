import dotenv from 'dotenv';

dotenv.config();

const MONGO_URL = process.env.MONGO_URI || '';
const SERVER_PORT = process.env.SERVER_PORT ? Number(process.env.SERVER_PORT) : 1337;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_easyeat_admin_key';

export const config = {
    mongo: {
        url: MONGO_URL
    },
    server: {
        port: SERVER_PORT
    },
    token: {
        secret: JWT_SECRET
    }
};
