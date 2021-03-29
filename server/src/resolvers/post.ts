import { isAuth } from './../middleware/isAuth';
import { Post } from './../entities/Post';
// Nesse arquivo vamos configurar o GraphQL
import { Arg, Ctx, Field, FieldResolver, InputType, Int, Mutation, ObjectType, Query, Resolver, Root, UseMiddleware } from 'type-graphql'
import { MyContext } from '../types';
import { getConnection } from 'typeorm';
import { Updoot } from './../entities/Updoot';


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

    @Mutation(() => Boolean)
    async vote(
        @Arg('postId', () => Int) postId: number,
        @Arg('value', () => Int) value: number,
        @Ctx() { req }: MyContext
    ) {
        
        const isUpdoot = value !== -1  
        const realValue = isUpdoot ? 1 : -1
        const { userId } = req.session

        // await Updoot.insert({
        //     userId,
        //     postId,
        //     value: realValue
        // })

        await getConnection().query(`
        START TRANSACTION;

        insert into updoot ("userId", "postId", value)
        values (${userId}, ${postId}, ${realValue});
        
        update post
        set points = points + ${realValue}
        where id = ${postId};

        COMMIT;
        `)
        return true
    }

    
    // modelo de type-graphQL query simples:
    // a query abaixo busca todos os posts da database
    @Query(() => PaginatedPosts) // precisamos definir o tipo
    async posts(
        @Arg('limit', () => Int) limit: number,
        @Arg('cursor', () => String, { nullable: true }) cursor: string | null, // será a data de criação do post
    ) : Promise<PaginatedPosts> {

        const realLimit = Math.min(50, limit)
        const realLimitPlusOne = realLimit + 1

        const replacements: any[] = [realLimitPlusOne]

        if (cursor) {
            replacements.push(new Date(parseInt(cursor)))
        }

        // dentro da funcao abaixo é onde colocamos sql personalizado para ser executado
        const posts = await getConnection().query(` 
        select p.*, 
        json_build_object(
            'id', u.id,
            'username', u.username,
            'email', u.email
            ) creator
        from post p
        inner join public.user u on u.id = p."creatorId"
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
        return Post.findOne(id)
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
    async updatePost(
        @Arg('id') id: number,
        @Arg('title', () => String, { nullable: true }) title: string,
    ) : Promise<Post> { 
        const post = await Post.findOne(id)
        if (!post) {
            return null
        }
        if (typeof title !== 'undefined') {
            await Post.update({ id }, { title })
        }
        return post
    }


    // A mutation abaixo deleta um novo post e o deleta na tabela do banco de dados
    @Mutation(() => Boolean) 
    async deletePost(
        @Arg('id') id: number,
    ) : Promise<Post> { 
        try {
            await Post.delete(id)
        } catch {
            return false
        }
        return true
    }
    
}