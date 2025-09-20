import { SessionService } from './services/utils/session.service';
import { serviceRegistry } from './factories/registry';

export const resolvers = (sessionService: SessionService) => ({
    Query: {
        sessions: async () => {
            return sessionService.getAll();
        },
        search: async (_: any, args: any) => {
            const service = serviceRegistry[args.store];
            if (!service) {
                throw new Error(`Service for store ${args.store} not found`);
            }
            const session = {
                id: 'test',
                userId: 'me',
                store: args.store,
                query: args.query,
                category: args.categoryId ? { name: String(args.categoryId) } : undefined,
                priceRange: args.priceRange as [number, number],
                createdAt: new Date(),
            };
            return service.search(session);
        },
    },
});
