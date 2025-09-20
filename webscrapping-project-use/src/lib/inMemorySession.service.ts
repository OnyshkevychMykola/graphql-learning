import { SessionService } from '../services/utils/session.service';
import { Session } from '../common/types';

export class InMemorySessionService implements SessionService {
    private sessions: Session[] = [];

    async getSessionsByUserId(userId: string): Promise<Session[]> {
        return this.sessions.filter((s) => s.userId === userId);
    }

    async getAll(): Promise<Session[]> {
        return this.sessions;
    }

    async getById(id: string): Promise<Session | null> {
        return this.sessions.find((s) => s.id === id) || null;
    }

    async create(session: Session): Promise<void> {
        this.sessions.push(session);
    }

    async delete(id: string, userId: string): Promise<boolean> {
        const index = this.sessions.findIndex((s) => s.id === id && s.userId === userId);
        if (index !== -1) {
            this.sessions.splice(index, 1);
            return true;
        }
        return false;
    }

    async update(session: Session): Promise<void> {
        const index = this.sessions.findIndex((s) => s.id === session.id);
        if (index !== -1) {
            this.sessions[index] = session;
        }
    }
}
