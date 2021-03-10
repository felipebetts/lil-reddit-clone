import { MyContext } from './../types';
import { Post } from './../entities/Post';
// Nesse arquivo vamos configurar o GraphQL
import { Arg, Ctx, Int, Mutation, Query, Resolver } from 'type-graphql'

@Resolver() // resolver é um class decorator para indicar que a classe será um schema type-graphQL
export class PostResolver {
    

    // modelo de type-graphQL query simples:
    // a query abaixo busca todos os posts da database
    @Query(() => [Post]) // precisamos definir o tipo
    posts(
        @Ctx() ctx: MyContext // aqui o MyContext definirá o tipo da response do query (vamos importá-lo do arquivo types.ts)
    ) : Promise<Post[]> {
        return ctx.em.find(Post, {})
    }

    // A proxima query seleciona apenas um post de acordo com o seu id:
    @Query(() => Post, { nullable: true }) // precisamos definir o tipo do retorno
    post(
        @Arg('id' ,() => Int) id: number,
        @Ctx() ctx: MyContext 
    ) : Promise<Post | null> { // em typescript | equivale ao || do javascript
        return ctx.em.findOne(Post, { id })
    }

    // A mutation abaixo cria um novo post e o insere na tabela do banco de dados
    @Mutation(() => Post) 
    async createPost(
        @Arg('title') title: string,
        @Ctx() ctx: MyContext 
    ) : Promise<Post> { 
        const post = ctx.em.create(Post, { title })
        await ctx.em.persistAndFlush(post)
        return post
    }


    // A mutation abaixo atualiza um post e o insere na tabela do banco de dados
    @Mutation(() => Post, { nullable: true }) 
    async updatePost(
        @Arg('id') id: number,
        @Arg('title', () => String, { nullable: true }) title: string,
        @Ctx() ctx: MyContext 
    ) : Promise<Post> { 
        const post = await ctx.em.findOne(Post, { id })
        if (!post) {
            return null
        }
        if (typeof title !== 'undefined') {
            post.title = title;
            await ctx.em.persistAndFlush(post) 
        }
        return post
    }


    // A mutation abaixo deleta um novo post e o deleta na tabela do banco de dados
    @Mutation(() => Boolean) 
    async deletePost(
        @Arg('id') id: number,
        @Ctx() ctx: MyContext 
    ) : Promise<Post> { 
        try {
            await ctx.em.nativeDelete(Post, { id })
        } catch {
            return false
        }
        return true
    }
    
}