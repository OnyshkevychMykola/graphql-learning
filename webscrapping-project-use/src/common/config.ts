import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port: process.env.PORT,
    botToken: process.env.BOT_TOKEN,
};
