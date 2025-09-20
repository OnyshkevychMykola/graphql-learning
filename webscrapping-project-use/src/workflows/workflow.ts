import { serviceRegistry } from '../factories/registry';
import { Session, Item } from '../common/types';
import { bot } from '../bot/bot';
import { SessionService } from '../services/utils/session.service';

export async function runWorkflow(sessionService: SessionService) {
    const sessions = await sessionService.getAll();
    if (!sessions.length) return;

    const now = new Date();
    const twoHours = 2 * 60 * 1000;

    for (const session of sessions) {
        if (now.getTime() - session.createdAt.getTime() > twoHours) {
            console.log(`Session ${session.id} expired and removed`);
            await sessionService.delete(session.id, session.userId);
            continue;
        }

        const service = serviceRegistry[session.store];
        if (!service) {
            console.warn(`No service found for store ${session.store}`);
            continue;
        }

        const items = await service.search(session);
        const newItems = filterNewItems(session, items);

        if (newItems.length > 0) {
            session.lastSeenIds = [...(session.lastSeenIds ?? []), ...newItems.map((i) => i.id)];
            await sessionService.update(session);

            const messages = service.formatMessage(newItems);
            for (const msg of messages) {
                await sendToTelegram(session.userId, msg);
            }
        }
    }
}

function filterNewItems(session: Session, items: Item[]): Item[] {
    const seen = new Set(session.lastSeenIds ?? []);

    return items.filter((i) => {
        // @ts-ignore
        const isNewer =
            !session.updatedAt ||
            new Date(i.updatedTime ?? 0).getTime() > new Date(session.updatedAt).getTime();
        return isNewer && !seen.has(i.id);
    });
}

async function sendToTelegram(userId: string, message: string) {
    try {
        await bot.telegram.sendMessage(userId, message, { parse_mode: 'HTML' });
        console.log(`✅ Message sent to ${userId}`);
    } catch (err) {
        console.error(`❌ Failed to send message to ${userId}:`, err);
    }
}
