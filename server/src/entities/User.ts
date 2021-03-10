import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { Field, Int, ObjectType } from "type-graphql";

// Nesse arquivo estamos definindo uma table no nosso banco relacional usando o Mikro-ORM.
// A tabela se chamará Post e terá as colunas id, createdAt, updatedAt, title, definidas abaixo

@ObjectType()
@Entity()
export class User {
    @Field(() => Int)
    @PrimaryKey()
    id!: number;
    
    @Field(() => String)
    @Property({ type: 'date' })
    createdAt = new Date();
    
    @Field(() => String)
    @Property({ type: 'date', onUpdate: () => new Date() })
    updatedAt = new Date();
    
    @Field(() => String)
    @Property({ type: 'text', unique: true })
    username!: string;

    @Property({ type: 'text' })
    password!: string;
}