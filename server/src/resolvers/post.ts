import { isAuth } from './../middleware/isAuth';
import { Post } from './../entities/Post';
// Nesse arquivo vamos configurar o GraphQL
import { Arg, Ctx, Field, FieldResolver, InputType, Int, Mutation, ObjectType, Query, Resolver, Root, UseMiddleware } from 'type-graphql'
import { MyContext } from '../types';
import { getConnection } from 'typeorm';
import { Updoot } from './../entities/Updoot';
import { User } from '../entities/User';


@InputType()
class PostInput {
    @Field()
    title: string
    
    @Field()
    text: string
}

@ObjectType()
class PaginatedPosts {
    @Field(() => [Post]) // tipo do type-graphql
    posts: Post[] // tipo do typescript
    @Field()
    hasMore: boolean
}


@Resolver(Post) // resolver é um class decorator para indicar que a classe será um schema type-graphQL
export class PostResolver {

    @FieldResolver(() => String)
    textSnippet(@Root() root: Post) {
        return root.text.slice(0, 50)
    }

    @FieldResolver(() => User)
    creator(
        @Root() post: Post,
        @Ctx() { userLoader }: MyContext
    ) {
        return userLoader.load(post.creatorId)
    }

    @FieldResolver(() => Int, { nullable: true })
    async voteStatus(
        @Root() post: Post,
        @Ctx() { updootLoader, req }: MyContext
    ) {

        if (!req.session.userId) {
            return null
        }

        const updoot = await updootLoader.load({
            postId: post.id,
            userId: req.session.userId
        })

        return updoot ? updoot.value : null
    }

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async vote(
        @Arg('postId', () => Int) postId: number,
        @Arg('value', () => Int) value: number,
        @Ctx() { req }: MyContext
    ) {
        
        const isUpdoot = value !== -1  
        const realValue = isUpdoot ? 1 : -1
        const { userId } = req.session

        const updoot = await Updoot.findOne({ where: { postId, userId }})

        if (updoot && updoot.value !== realValue) {
            // se o usuário já tiver dado updoot(like) no post,
            // e estão alterando o valor do updoot ( de +1 para -1 ou ao contrario)

            await getConnection().transaction(async tm => {
                
                // altera o valor do updoot
                await tm.query(`
                    update updoot
                    set value = $1
                    where "postId" = $2 and "userId" = $3
                `, [realValue, postId, userId])
                
                // atualiza os pontos(updoots) do post
                await tm.query(`
                    update post
                    set points = points + $1
                    where id = $2
                `, [2 * realValue, postId])
                // acima é 2*realValue pq além de tirarmos o voto original, adicionamos um novo no sentido oposto
            })
        } else if (!updoot) {
            // usuário nunca votou antes nesse post
            await getConnection().transaction(async tm => { // tm é uma referencia para transaction manager object
                await tm.query(`
                    insert into updoot ("userId", "postId", value)
                    values ($1, $2, $3);
                `, [userId, postId, realValue])

                await tm.query(`
                    update post
                    set points = points + $1
                    where id = $2
                `, [realValue, postId])
            })
        }
        return true
    }

    
    // modelo de type-graphQL query simples:
    // a query abaixo busca todos os posts da database
    @Query(() => PaginatedPosts) // precisamos definir o tipo
    async posts(
        @Arg('limit', () => Int) limit: number,
        @Arg('cursor', () => String, { nullable: true }) cursor: string | null, // será a data de criação do post
        @Ctx() { req }: MyContext
    ) : Promise<PaginatedPosts> {

        const realLimit = Math.min(50, limit)
        const realLimitPlusOne = realLimit + 1

        const replacements: any[] = [realLimitPlusOne]

        if (cursor) {
            replacements.push(new Date(parseInt(cursor)))
        }

        // dentro da funcao abaixo é onde colocamos sql personalizado para ser executado
        const posts = await getConnection().query(` 
        select p.*
        from post p
        ${ cursor ? `where p."createdAt" < $2`: "" /* o $1 aponta para o array que vamos declarar apos a query */}
        order by p."createdAt" DESC
        limit $1
        `, replacements)
        
        // const myQueryBuilder = getConnection()
        //     .getRepository(Post)
        //     .createQueryBuilder("p") // p é um apelido para posts
        //     .innerJoinAndSelect(
        //         "p.creator",
        //         "u", // u é para user
        //         'u.id = p."creatorId"' // join o user cujo id seja igual ao creatorId
        //         // obs: como creatorId está em camelCase, precisamos colocar com aspas duplas envolta para ser interpretado corretamente
        //     )
        //     .orderBy('p."createdAt"', "DESC")
        //     .take(realLimitPlusOne)
            
        // if(cursor) {
        //     myQueryBuilder.where('p."createdAt" < :cursor', { cursor: new Date(parseInt(cursor)) })
        // }

        // const posts = await myQueryBuilder.getMany()

        return {
            posts: posts.slice(0, realLimit),
            hasMore: posts.length === realLimitPlusOne
        }
    }

    // A proxima query seleciona apenas um post de acordo com o seu id:
    @Query(() => Post, { nullable: true }) // precisamos definir o tipo do retorno
    post(
        @Arg('id' ,() => Int) id: number,
    ) : Promise<Post | undefined> { // em typescript | equivale ao || do javascript
        return Post.findOne(id, { relations: ["creator"] })
    }

    // A mutation abaixo cria um novo post e o insere na tabela do banco de dados
    @Mutation(() => Post) 
    @UseMiddleware(isAuth)
    async createPost(
        @Arg('input') input: PostInput,
        @Ctx() { req }: MyContext,
    ) : Promise<Post> { 
        return Post.create({
            ...input,
            creatorId: req.session.userId,
        }).save()
    }


    // A mutation abaixo atualiza um post e o insere na tabela do banco de dados
    @Mutation(() => Post, { nullable: true })
    @UseMiddleware(isAuth)
    async updatePost(
        @Arg('id', () => Int) id: number,
        @Arg('title', () => String, { nullable: true }) title: string,
        @Arg('text', () => String, { nullable: true }) text: string,
        @Ctx() { req }: MyContext,
    ) : Promise<Post> { 

        const result = await getConnection()
            .createQueryBuilder()
            .update(Post)
            .set({ title, text })
            .where( 'id = :id and "creatorId" = :creatorId' , { id, creatorId: req.session.userId })
            .returning("*")
            .execute()

        return result.raw[0]
    }


    // A mutation abaixo deleta um novo post e o deleta na tabela do banco de dados
    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async deletePost(
        @Arg('id', () => Int) id: number,
        @Ctx() { req }: MyContext
    ) : Promise<boolean> { 

        const post = await Post.findOne(id)

        if(!post) {
            return false
        }

        if (post.creatorId !== req.session.userId) {
            // se o dono do post nao for o usuario atual, 
            // nao podemos permitir que ele delete o post
            throw new Error('Esse post é de outro usuário e não pode ser deletado por você')
        }

        try {
            await Post.delete({ id, creatorId: req.session.userId})
            console.log('deletou')
        } catch {
            console.log('nao deletou')
            return false
        }
        return true
    }
    
}