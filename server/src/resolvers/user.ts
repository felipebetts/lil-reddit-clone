// Nesse arquivo vamos configurar o GraphQL
import "reflect-metadata"
import { User } from "../entities/User"
import { MyContext } from "src/types"
import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Query, Resolver } from 'type-graphql'
import argon2 from "argon2"
import { EntityManager } from '@mikro-orm/postgresql'


// os InputType são os tipos de cada input que será um arg dentro das mutations
// Abaixo estamos configurando o tipo dos inputs de usuario e senha
@InputType()
class UsernamePasswordInput {
    @Field()
    username: string
    
    @Field()
    password: string
}

@ObjectType()
class FieldError {
    @Field()
    field: string
    
    @Field()
    message: string
}

// os ObjectType são os tipos de algum objeto a ser retornado
// no caso abaixo será o tipo do objeto de retorno da funcao de login
@ObjectType() 
class UserResponse {
    @Field(() => [FieldError], { nullable: true}) // quand os atributos nao sao obrigatorios precisamos explicitar o tipo e adicionar o nullable:true
    errors?: FieldError[]
    // ao adicionarmos o ? acima estamos dizendo que esse atributo não é obrigatório(ou seja, pode ser undefined)

    @Field(() => User, { nullable: true})
    user?: User
}

@Resolver() // resolver é um class decorator para indicar que a classe será um schema graphQL
export class UserResolver {

    // A query "me" abaixo serve para sabermos qual o usuário atual
    @Query(() => User, { nullable: true })
    async me(
        @Ctx() { req, em }: MyContext
    ) {
        if (!req.session.userId) { // se nao existir usuário logado (cookie do userId)
            return null
        }

        const user = await em.findOne(User, { id: req.session.userId })
        return user
    }
    
    // A mutation abaixo realiza o cadastro de um novo usuário
    @Mutation(() => UserResponse)
    async register(
        @Arg('options') options: UsernamePasswordInput,
        @Ctx() { em, req }: MyContext
    ): Promise<UserResponse> {
        if(options.username.length <= 2) {
            return {
                errors: [
                    {
                        field: "username",
                        message: "length must be greater than 2"
                    }
                ]
            }
        }
        if(options.password.length <= 2) {
            return {
                errors: [
                    {
                        field: "password",
                        message: "length must be greater than 3"
                    }
                ]
            }
        }


        const hashedPassword = await argon2.hash(options.password) // essa funcao do argon2 retorna a senha encriptografada

        // const user = em.create(User, { 
        //     username: options.username, 
        //     password: hashedPassword 
        // }) // para usar com a forma automática de gravar dados no banco de dados

        let user
        try {
            // await em.persistAndFlush(user) // forma automática de gravar o usuario no banco de dados

            const result = await (em as EntityManager)
                .createQueryBuilder(User)
                .getKnexQuery()
                .insert({
                    username: options.username, 
                    password: hashedPassword,
                    created_at: new Date(),
                    updated_at: new Date()
                })
                .returning('*') // forma manual de gravar o usuário no banco de dados (usar no caso de erros)
            user = result[0]
        } catch(err) {
            if(err.code === '23505') {
                return {
                    errors: [{
                        field: "username",
                        message: "username already exists"
                    }]
                }
            }
        }

        req.session.userId = user.id

        return {
            user,
        } 
    }

    // A mutation abaixo realiza o login de um usuário
    @Mutation(() => UserResponse)
    async login(
        @Arg('options') options: UsernamePasswordInput,
        @Ctx() { em, req }: MyContext // @ctx indica o contexto, que nesse caso é o Mycontext que está localizado no arquivo types.ts
    ): Promise<UserResponse> {
        const user = await em.findOne(User, { username: options.username })
        if(!user) {
            return {
                errors: [{
                    field: 'username',
                    message: 'username doesnt exists'
                }]
            }
        }
        const valid = await argon2.verify(user.password, options.password)
        if(!valid) {
            return {
                errors: [
                    {
                        field: "password",
                        message: "incorrect password"
                    }
                ]
            }
        }

        req.session.userId = user.id // essa linha guarda na session(e no cookie) o id do usuario

        if(req.session.userId === user.id) {
            console.log(user.id)
        }

        return {
            user,
        }
    }
}
