import { SessionService } from '../services/utils/session.service';
import { Markup } from 'telegraf';
import { Session } from '../common/types';
import { bot, userState } from './bot';
import { categories } from '../common/storage';

export function registerBotHandlers(sessionService: SessionService) {
    bot.start((ctx) => {
        userState.set(ctx.from.id, { step: 'askQuery' });

        return ctx.reply(
            'Привіт! 👋 Обери сайт для пошуку:',
            Markup.inlineKeyboard([
                [Markup.button.callback('OLX', 'select_olx')],
                [Markup.button.callback('Prom', 'select_prom')],
            ])
        );
    });

    bot.command('sessions', async (ctx) => {
        const userId = String(ctx.from.id);
        const userSessions = await sessionService.getSessionsByUserId(userId);

        if (!userSessions.length) {
            return ctx.reply('📭 У тебе ще немає створених сесій.');
        }

        userSessions.forEach((s, idx) => {
            let message = `#${idx + 1}\n`;
            message += `🆔 ID: ${s.id}\n`;
            message += `🛒 Store: ${s.store}\n`;
            message += `🔎 Запит: ${s.query}\n`;
            if (s.category) {
                message += `📂 Категорія: ${s.category.name}`;
                if (s.category.children) {
                    message += ` → ${s.category.children.name}`;
                }
                message += `\n`;
            } else {
                message += `📂 Категорія: не вказана\n`;
            }
            if (s.priceRange) {
                message += `💰 Ціна: ${s.priceRange[0]} - ${s.priceRange[1]}\n`;
            } else {
                message += `💰 Ціна: не вказана\n`;
            }

            ctx.reply(
                message,
                Markup.inlineKeyboard([[Markup.button.callback('❌ Відмінити', `cancel_${s.id}`)]])
            );
        });
    });

    bot.action(/cancel_(.+)/, async (ctx) => {
        const sessionId = ctx.match[1];
        const userId = String(ctx.from.id);

        const session = await sessionService.getById(sessionId);

        if (!session || session.userId !== userId) {
            return ctx.answerCbQuery('⚠️ Сесію не знайдено або вона не твоя');
        }

        await sessionService.delete(sessionId, userId);

        await ctx.answerCbQuery('✅ Сесію відмінено');
        await ctx.editMessageText('❌ Ця сесія була відмінена');
    });

    bot.action('select_olx', async (ctx) => {
        const state = userState.get(ctx.from.id) || {};
        state.site = 'olx-service';
        userState.set(ctx.from.id, state);

        await ctx.answerCbQuery();
        return ctx.reply(
            '✅ Ти обрав OLX. Тепер введи пошуковий запит (наприклад: "взуття жіноче")'
        );
    });

    bot.action('select_prom', async (ctx) => {
        const state = userState.get(ctx.from.id) || {};
        state.site = 'prom-service';
        userState.set(ctx.from.id, state);

        await ctx.answerCbQuery();
        return ctx.reply(
            '✅ Ти обрав Prom. Тепер введи пошуковий запит (наприклад: "чохол для телефону")'
        );
    });

    bot.on('text', async (ctx) => {
        const userId = ctx.from.id;
        let state = userState.get(userId) || {};

        if (!state.site) {
            return ctx.reply('⚠️ Спочатку обери сайт командою /start.');
        }

        const text = ctx.message.text.trim();

        if (!state.query) {
            state.query = text;
            state.step = 'askCategory';
            userState.set(userId, state);

            const storeCategories = categories[state.site];
            return ctx.reply(
                '📂 Обери категорію:',
                Markup.inlineKeyboard(
                    Object.keys(storeCategories).map((cat) => [
                        Markup.button.callback(cat, `cat_${cat}`),
                    ])
                )
            );
        }

        if (state.step === 'askPrice') {
            let priceFrom: number | undefined;
            let priceTo: number | undefined;
            let cleanQuery = state.query;

            if (text.toLowerCase() !== 'skip') {
                const rangeMatch = text.match(/(\d+)\s*-\s*(\d+)/);
                if (rangeMatch) {
                    priceFrom = parseInt(rangeMatch[1], 10);
                    priceTo = parseInt(rangeMatch[2], 10);
                }

                const fromMatch = text.match(/(?:від\s*)?(\d+)\+?/i);
                if (fromMatch && !rangeMatch) {
                    priceFrom = parseInt(fromMatch[1], 10);
                }

                const toMatch = text.match(/(?:до\s*|<=\s*)(\d+)/i);
                if (toMatch && !rangeMatch) {
                    priceTo = parseInt(toMatch[1], 10);
                }
            }

            const newSession: Session = {
                id: String(Date.now()),
                userId: String(userId),
                store: state.site,
                query: cleanQuery!,
                category: state.category
                    ? {
                          name: state.category,
                          children: state.subcategory ? { name: state.subcategory } : undefined,
                      }
                    : undefined,
                priceRange:
                    priceFrom || priceTo
                        ? [priceFrom || 0, priceTo || Number.MAX_SAFE_INTEGER]
                        : undefined,
                createdAt: new Date(),
                updatedAt: null,
                lastSeenIds: [],
            };

            await sessionService.create(newSession);

            await ctx.reply(
                `✅ Нова сесія створена!\n` +
                    `📌 ID: ${newSession.id}\n` +
                    `🛒 Store: ${newSession.store}\n` +
                    `🔎 Запит: ${newSession.query}\n` +
                    (newSession.category
                        ? `📂 Категорія: ${newSession.category.name}${newSession.category.children ? ' → ' + newSession.category.children.name : ''}`
                        : '📂 Категорія: не вказана') +
                    `\n` +
                    (newSession.priceRange
                        ? `💰 Ціна: ${newSession.priceRange[0]} - ${newSession.priceRange[1]}`
                        : '💰 Ціна: не вказана')
            );

            userState.delete(userId);
        }
    });

    bot.action(/cat_(.+)/, async (ctx) => {
        const category = ctx.match[1];
        const state = userState.get(ctx.from.id) || {};
        state.category = category;
        state.step = 'askSubCategory';
        const site = state?.site || 'olx-service';
        userState.set(ctx.from.id, state);
        const storeCategories = categories[site];

        await ctx.answerCbQuery();
        return ctx.reply(
            `📂 Ти обрав категорію: ${category}. Обери підкатегорію:`,
            Markup.inlineKeyboard(
                storeCategories[category].map((sub: any) => [
                    Markup.button.callback(sub, `sub_${sub}`),
                ])
            )
        );
    });

    bot.action(/sub_(.+)/, async (ctx) => {
        const subcategory = ctx.match[1];
        const state = userState.get(ctx.from.id) || {};
        state.subcategory = subcategory;
        state.step = 'askPrice';
        userState.set(ctx.from.id, state);

        await ctx.answerCbQuery();
        return ctx.reply(
            '💰 Введи бажаний діапазон ціни (наприклад "2000-5000", "від 3000", "до 5000") або напиши "skip".'
        );
    });
}
