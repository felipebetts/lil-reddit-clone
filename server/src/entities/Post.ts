import { Field, Int, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Updoot } from "./Updoot";
import { User } from "./User";

// Nesse arquivo estamos definindo uma table no nosso banco relacional usando o TypeORM.
// A tabela se chamará Post e terá as colunas id, createdAt, updatedAt, title, definidas abaixo

@ObjectType()
@Entity()
export class Post extends BaseEntity {
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id!: number;
     
    @Field()
    @Column()
    title!: string;

    @Field()
    @Column()
    text!: string;
    
    @Field()
    @Column({ type: "int", default: 0 })
    points!: number;

    @Field()
    @Column()
    creatorId: number;

    @Field()
    @ManyToOne(() => User, user => user.posts)
    creator: User;

    @OneToMany(() => Updoot, (updoot) => updoot.user)
    updoots: Updoot[]

    @Field(() => String)
    @CreateDateColumn()
    createdAt: Date;
    
    @Field(() => String)
    @UpdateDateColumn()
    updatedAt: Date;
}