import { Field, InputType } from 'type-graphql';

// os InputType são os tipos de cada input que será um arg dentro das mutations
// Abaixo estamos configurando o tipo dos inputs de usuario e senha


@InputType()
export class UsernamePasswordInput {
    @Field()
    email: string;

    @Field()
    username: string;

    @Field()
    password: string;
}
