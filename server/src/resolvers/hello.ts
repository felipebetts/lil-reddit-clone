// Nesse arquivo vamos configurar o GraphQL
import "reflect-metadata"
import { Query, Resolver } from 'type-graphql'

@Resolver() // resolver é um class decorator para indicar que a classe será um schema graphQL
export class HelloResolver {
    
    // modelo de graphQL query simples:
    @Query(() => String)
    hello() {
        return 'hello world'
    }
}
