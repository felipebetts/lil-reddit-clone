import { Field, Int, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryColumn } from "typeorm"; 
import { Post } from "./Post";
import { User } from "./User";

// o updoot é a curtida na nossa rede social
// o updoot implica uma relacao many-to-many entre usuarios e posts
// cada usuário pode curtir multiplos posts e cada post pode ter curtidas de  diferentes usuarios

// a tabela de updoots será uma uniao das tabelas users e posts

// many to many
// user <-> posts
// user -> join table <- posts
// user -> updoot <- posts

@ObjectType()
@Entity()
export class Updoot extends BaseEntity {

    @Field()
    @Column({ type: "int" })
    value: number

    // @Field()
    @PrimaryColumn()
    userId: number;

    @Field(() => User)
    @ManyToOne(() => User, user => user.updoots) //
    user: User;

    @Field()
    @PrimaryColumn()
    postId: number;

    @Field(() => Post)
    @ManyToOne(() => Post, post => post.updoots) // 
    post: Post;
}