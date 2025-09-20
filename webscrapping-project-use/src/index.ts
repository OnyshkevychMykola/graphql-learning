import { app } from './connections/server';
import { bot } from './bot/bot';
import { config } from './common/config';
import { runWorkflow } from './workflows/workflow';
import cron from 'node-cron';
import { createSessionService } from './factories/sessionFactory';
import { registerBotHandlers } from './bot/botHandlers';
import * as fs from 'node:fs';
import { resolvers } from './resolvers';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { graphqlHTTP } from 'express-graphql';

const PORT = config.port || 3000;

async function bootstrap() {
    const sessionService = await createSessionService();

    const typeDefs = fs.readFileSync('./src/schema.graphql', 'utf-8');
    const schema = makeExecutableSchema({ typeDefs, resolvers: resolvers(sessionService) });

    app.use(
        '/graphql',
        graphqlHTTP({
            schema,
            graphiql: true,
        })
    );

    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`🔎 GraphQL ready at http://localhost:${PORT}/graphql`);
    });

    registerBotHandlers(sessionService);
    cron.schedule('*/20 * * * * *', async () => {
        const sessions = await sessionService.getAll();
        console.log('Sessions:', sessions);
    });
    cron.schedule('*/1 * * * *', () => {
        console.log('⏰ Running scheduled workflow...');
        runWorkflow(sessionService);
    });

    await bot.launch();
    console.log('🤖 Telegram bot started');
}
bootstrap();
