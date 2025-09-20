import { OlxService } from '../services/stores/olxService';
import { SearchService } from '../services/utils/search.service';
import { PromService } from '../services/stores/promService';

// @ts-ignore
export const serviceRegistry: Record<string, SearchService> = {
    'olx-service': new OlxService(),
    'prom-service': new PromService(),
};
