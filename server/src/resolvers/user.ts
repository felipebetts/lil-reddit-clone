import { FORGET_PASSWORD_PREFIX } from './../constants';
import { validateRegister } from './../utils/validateRegister';
// Nesse arquivo vamos configurar o GraphQL
// import "reflect-metadata"
import { User } from "../entities/User"
import { MyContext } from "../types"
import { Arg, Ctx, Field, FieldResolver, Mutation, ObjectType, Query, Resolver, Root } from 'type-graphql'
import argon2 from "argon2"
import { COOKIE_NAME } from "../constants"
import { UsernamePasswordInput } from "./UsernamePasswordInput"
import { sendEmail } from '../utils/sendEmail';
import { v4 } from 'uuid'
import { getConnection } from 'typeorm';


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

@Resolver(User) // resolver é um class decorator para indicar que a classe será um schema graphQL
export class UserResolver {

    @FieldResolver(() => String)
    email(
        @Root() user: User,
        @Ctx() { req }: MyContext
    ) {

        if (req.session.userId === user.id) {
            // se o usuário for o dono do post, entao ele pode ver o seu proprio email:
            return user.email
        }

        // usuário nao pode ver o email:
        return ""
    }

    @Mutation(() => UserResponse)
    async changePassword(
        @Arg('token') token: string,
        @Arg('newPassword') newPassword: string,
        @Ctx() { redis, req }: MyContext
    ): Promise<UserResponse> {
        if (newPassword.length <= 2) {
            return { errors: [
                {
                    field: "newPassword",
                    message: "length must be greater than 2"
                }
            ]}
        }

        const key = FORGET_PASSWORD_PREFIX + token
        const userId = await redis.get(key)
        if (!userId) {
            return { 
                errors: [
                {
                    field: "token",
                    message: "token expired"
                }
            ]}
        }
        console.log(userId)

        const userIdNum = parseInt(userId)
        const user = await User.findOne(userIdNum)

        if(!user) {
            return { 
                errors: [
                {
                    field: "token",
                    message: "user no longer exists"
                }
            ]}
        }

        await User.update(
            { id: userIdNum }, 
            { password: await argon2.hash(newPassword) } // essa funcao do argon2 retorna a senha encriptografada
        )

        redis.del(key)


        // realizar login do usuario apos mudar a senha:
        req.session.userId = user.id

        return { user }

        // user.password = 
    }

    @Mutation(() => Boolean)
    async forgotPassword(
        @Arg('email') email: string,
        @Ctx() { redis }: MyContext
    ) {
        const user = await User.findOne({ where: { email }}) // como o email nao é primary key, precisamos usar o where
        if (!user) {
            // email nao esta no db
            return true
        }

        const token = v4()

        await redis.set(FORGET_PASSWORD_PREFIX + token, user.id, 'ex', 1000 * 60 * 60 * 24 * 3) // 3 dias

        await sendEmail(
            email, 
            `<a href="${process.env.CORS_ORIGIN}/change-password/${token}">Reset Password</a>`
        )

        return true
    }

    // A query "me" abaixo serve para sabermos qual o usuário atual
    @Query(() => User, { nullable: true })
    async me(
        @Ctx() { req }: MyContext
    ) {
        if (!req.session.userId) { // se nao existir usuário logado (cookie do userId)
            return null
        }

        const user = await User.findOne(req.session.userId) 
        return user
    }
    
    // A mutation abaixo realiza o cadastro de um novo usuário
    @Mutation(() => UserResponse)
    async register(
        @Arg('options') options: UsernamePasswordInput,
        @Ctx() { req }: MyContext
    ): Promise<UserResponse> {
        
        const errors = validateRegister(options)
        if (errors) {
            return { errors }
        }

        const hashedPassword = await argon2.hash(options.password) // essa funcao do argon2 retorna a senha encriptografada

        // const user = em.create(User, { 
        //     username: options.username, 
        //     password: hashedPassword 
        // }) // para usar com a forma automática de gravar dados no banco de dados

        let user
        try {
            // User.create({
            //     username: options.username,
            //     password: hashedPassword,
            //     email: options.email,
            // }).save()
            // o codigo comentado acima realiza o mesmo que o resto do codigo dentro de try
            const result = await getConnection()
                .createQueryBuilder()
                .insert()
                .into(User)
                .values({
                    username: options.username,
                    password: hashedPassword,
                    email: options.email,
                    // created_at: new Date(),
                    // updated_at: new Date()
                })
                .returning("*")
                .execute()
            // console.log('result:', result)
            user = result.raw[0];
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
        @Arg('usernameOrEmail') usernameOrEmail: string,
        @Arg('password') password: string,
        @Ctx() { req }: MyContext // @ctx indica o contexto, que nesse caso é o Mycontext que está localizado no arquivo types.ts
    ): Promise<UserResponse> {
        const user = await User.findOne( 
            usernameOrEmail.includes('@') ? 
            { where: { email: usernameOrEmail }} : { where: { username: usernameOrEmail }}
        )
        if(!user) {
            return {
                errors: [{
                    field: 'usernameOrEmail',
                    message: 'username doesnt exists'
                }]
            }
        }
        const valid = await argon2.verify(user.password, password)
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

        // if(req.session.userId === user.id) {
        //     console.log(user.id)
        // }

        return {
            user,
        }

    }


    @Mutation(() => Boolean)
    logout(
        @Ctx() { req, res }: MyContext
    ) {
        // o req.session.destroy irá destruir a session atual no redis
        return new Promise(resolve => req.session.destroy(err => {
            if(err) {
                console.log(err)
                resolve(false)
                return
            }
            // Ao colocarmos o clearCookie abaixo do if(err), estamos dizendo que o cookie só
            // será destruido(deletado) se não ocorrer nenhum erro ao fazer o req.session.destroy
            // Se quisermos que o cookie seja deletado mesmo que ocorra erro, é só colocar a linha de clearCookie antes do if(err)
            res.clearCookie(COOKIE_NAME) // aqui destruimos o cookie
            resolve(true)
        }))
    }
}
