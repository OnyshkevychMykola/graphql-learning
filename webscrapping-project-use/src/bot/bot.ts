import { Telegraf } from 'telegraf';
import { config } from '../common/config';

const BOT_TOKEN = config.botToken || '';
export const bot = new Telegraf(BOT_TOKEN);

export type UserState = {
    site?: string;
    query?: string;
    category?: string;
    subcategory?: string;
    step?: 'askQuery' | 'askCategory' | 'askSubCategory' | 'askPrice';
};

export const userState = new Map<number, UserState>();
