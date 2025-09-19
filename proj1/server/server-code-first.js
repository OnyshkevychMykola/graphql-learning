import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { queryType, makeSchema } from 'nexus';

const Query = queryType({
    definition: (t) => {
        t.string('greeting', {
            resolve:  () => 'Hello world',
        })
    }
});

const schema = makeSchema({types: [Query]})

const server = new ApolloServer({schema})
const {url} = await startStandaloneServer(server, { listen: { port: 9000 }});
console.log(`Server running at ${url}`)