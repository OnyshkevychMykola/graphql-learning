import { Session } from '../../common/types';

export interface SessionService {
    getAll(): Promise<Session[]>;
    getById(id: string): Promise<Session | null>;
    getSessionsByUserId(userId: string): Promise<Session[]>;
    create(session: Session): Promise<void>;
    delete(id: string, userId: string): Promise<boolean>;
    update(session: Session): Promise<void>;
}
