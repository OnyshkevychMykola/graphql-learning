import { Item, Session } from '../../common/types';

export interface SearchService {
    search(session: Session): Promise<Item[]>;
    formatMessage(newItems: Item[]): string[];
}
