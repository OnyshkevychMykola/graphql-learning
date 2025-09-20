import { Collection, Db } from 'mongodb';
import { SessionService } from '../services/utils/session.service';
import { Session } from '../common/types';

export class MongoSessionService implements SessionService {
    private collection: Collection<Session>;

    constructor(db: Db) {
        this.collection = db.collection<Session>('sessions');
    }

    async getSessionsByUserId(userId: string): Promise<Session[]> {
        return this.collection.find({ userId }).toArray();
    }

    async getAll(): Promise<Session[]> {
        return this.collection.find().toArray();
    }

    async getById(id: string): Promise<Session | null> {
        return this.collection.findOne({ id });
    }

    async create(session: Session): Promise<void> {
        await this.collection.insertOne(session);
    }

    async delete(id: string, userId: string): Promise<boolean> {
        const result = await this.collection.deleteOne({ id, userId });
        return result.deletedCount > 0;
    }

    async update(session: Session): Promise<void> {
        await this.collection.updateOne({ id: session.id }, { $set: session });
    }
}
