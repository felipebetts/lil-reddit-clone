import { isAuth } from './../middleware/isAuth';
import { Post } from './../entities/Post';
// Nesse arquivo vamos configurar o GraphQL
import { Arg, Ctx, Field, InputType, Int, Mutation, Query, Resolver, UseMiddleware } from 'type-graphql'
import { MyContext } from 'src/types';
import { getConnection } from 'typeorm';


@InputType()
class PostInput {
    @Field()
    title: string
    
    @Field()
    text: string
}


@Resolver() // resolver é um class decorator para indicar que a classe será um schema type-graphQL
export class PostResolver {
    

    // modelo de type-graphQL query simples:
    // a query abaixo busca todos os posts da database
    @Query(() => [Post]) // precisamos definir o tipo
    async posts(
        @Arg('limit', () => Int) limit: number,
        @Arg('cursor', () => String, { nullable: true }) cursor: string | null, // será a data de criação do post
    ) : Promise<Post[]> {

        const realLimit = Math.min(50, limit)

        const myQueryBuilder = getConnection()
            .getRepository(Post)
            .createQueryBuilder("p") // p é um apelido para posts
            // .where('"createdAt" > :cursor', { cursor: parseInt(cursor) })
            .orderBy('"createdAt"', "DESC")
            .take(realLimit)
            
        if(cursor) {
            myQueryBuilder.where('"createdAt" < :cursor', { cursor: new Date(parseInt(cursor)) })
        }

        return myQueryBuilder.getMany()
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