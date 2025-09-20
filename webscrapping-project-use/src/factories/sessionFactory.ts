import { MongoClient } from 'mongodb';
import { SessionService } from '../services/utils/session.service';
import { MongoSessionService } from '../lib/mongoSession.service';
import { InMemorySessionService } from '../lib/inMemorySession.service';

export async function createSessionService(): Promise<SessionService> {
    if (process.env.SESSION_STORAGE === 'mongo') {
        const client = await MongoClient.connect(process.env.MONGO_URI!, {
            directConnection: true,
        });
        const db = client.db(process.env.MONGO_DB || 'myapp');
        return new MongoSessionService(db);
    }

    return new InMemorySessionService();
}
