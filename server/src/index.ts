import "reflect-metadata"
import { PostResolver } from './resolvers/post';
import { HelloResolver } from './resolvers/hello';
import { UserResolver } from "./resolvers/user";
// import { Post } from './entities/Post';
import { COOKIE_NAME, __prod__ } from './constants';
import express from 'express'
import { ApolloServer } from 'apollo-server-express'
import { buildSchema } from 'type-graphql'
import Redis from 'ioredis';
import session from 'express-session';
import connectRedis from 'connect-redis'
import cors from 'cors'
import { createConnection } from 'typeorm'
import { Post } from "./entities/Post";
import { User } from "./entities/User";
import path from 'path'

// import { User } from "./entities/User";
// await orm.em.nativeDelete(User, { username: "beto" }) // deleta todos os usuátios do banco de dados


const main = async () => {
    const conn = await createConnection({
        type: 'postgres',
        database: 'lireddit2',
        username: 'postgres',
        password: '1237Trinta',
        logging: true,
        synchronize: true,
        migrations: [path.join(__dirname, './migrations/*')],
        entities: [Post, User]
    })

    await conn.runMigrations()

    // await Post.delete({})

    const app = express()

    const RedisStore = connectRedis(session)
    const redis = new Redis()

    app.use(cors({
        origin: "http://localhost:3000",
        credentials: true // quando true nao aceita origin como *
    }))

    // a midleware session abaixo precisa ser colocada ANTES da middleware do apolloServer, pois o apollo utilizará os dados de session
    app.use(
        session({
            name: COOKIE_NAME,
            store: new RedisStore({ 
                client: redis,
                disableTouch: true, // essa linha desabilita a checagem automatica de tempo de sessao, ou seja, a sessao ficará aberta para sempre
            }),
            // abaixo vamos definir as configuracoes do cookie que será gerado:
            cookie: {
                // maxAge indica o tempo de vida do cookie; por quanto tempo ele irá existir. A unidade é ms
                maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // nesse caso o tempo de vida do cookie será 10 anos
                httpOnly: true, // boas práticas de seguranca. o cookie nao será acessível para o javascript do frontend
                sameSite: "lax",  // csrf. buscar no google
                secure: false //__prod__, // quando true o cookie só funcionará para dominios https
            },
            saveUninitialized: false, // quando true irá salvar o cookie mesmo que não hajam dados para preenchê-lo(salva o cookie vazio)
            secret: 'show de bola', 
            resave: false,
        })
    )

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloResolver, PostResolver, UserResolver],
            validate: false
        }),
        context: ({ req, res }) => ({ req, res, redis }) // context é um objeto que estará disponível para todos os resolvers
    })

    // o apollo pode aplicar o cors para a rota em que ele está configurado 
    // se o cors nao for setado para false o apollo irá configurar um cors automaticamente
    apolloServer.applyMiddleware({ 
        app,
        cors: false
    })

    app.listen(4000, () => {
        console.log('servidor rodando em localhost:4000')
    })
};


main().catch(err => {
    console.error(err)
});






















// observacoes feitas durante o processo:


// const post = orm.em.create(Post, {title: 'my first post'}) // aqui criamos um novo post(novo row na table) (quase como instanciar uma classe)
// await orm.em.persistAndFlush(post) // inserir post na database 
// const posts = await orm.em.find(Post, {})