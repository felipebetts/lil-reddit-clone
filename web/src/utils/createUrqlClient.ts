import gql from 'graphql-tag';
import { DeletePostMutationVariables, VoteMutationVariables } from './../generated/graphql';
// Nesse arquivo vamos criar o cliente urql
// esse cliente nos dará também a habilidade de realizar Server Side Rendering(SSR)

import { dedupExchange, Exchange, fetchExchange, stringifyVariables } from "urql"
import { pipe, tap } from 'wonka'
import { LogoutMutation, MeQuery, MeDocument, LoginMutation, RegisterMutation } from "../generated/graphql"
import { cacheExchange, Resolver, Cache } from '@urql/exchange-graphcache'
import { betterUpdateQuery } from "./betterUpdateQuery"
import Router from 'next/router'
import { isServer } from './isServer';

const errorExchange: Exchange = ({ forward }) => (ops$) => {
  return pipe(
    forward(ops$),
    tap(({ error }) => {
      if (error?.message.includes("não autorizado")) {
        Router.replace("/login")
      }
    })
  )
}

const cursorPagination = (): Resolver => {

  return (_parent, fieldArgs, cache, info) => {
    const { parentKey: entityKey, fieldName } = info;
    const allFields = cache.inspectFields(entityKey);
    const fieldInfos = allFields.filter(info => info.fieldName === fieldName);
    const size = fieldInfos.length;
    if (size === 0) {
      return undefined;
    }

    const fieldKey = `${fieldName}(${stringifyVariables(fieldArgs)})`

    const isItInTheCache = cache.resolve(
      cache.resolveFieldByKey(entityKey, fieldKey) as string,
      "posts"
    )

    info.partial = !isItInTheCache // assim o urql irá realizar a query para adquirir o resto dos posts
    let hasMore = true
    console.log()
    const results: string[] = []
    fieldInfos.forEach((fi) => {
      const key = cache.resolveFieldByKey(entityKey, fi.fieldKey) as string
      const data = cache.resolve(key, 'posts') as string[]
      const _hasMore = cache.resolve(key, 'hasMore')
      if (!_hasMore) {
        hasMore = _hasMore as boolean
      }
      results.push(...data)
    })

    // console.log(results)
    return {
      __typename: "PaginatedPosts",
      hasMore,
      posts: results
    }
  };
};

const invalidateAllPosts = (cache: Cache) => {
  // essa funcao invalida o cache dos posts, para que seja realizado uma nova query com os posts atualizados
  const allFields = cache.inspectFields('Query')
  const fieldInfos = allFields.filter((info) => info.fieldName === 'posts')
  fieldInfos.forEach((fi) => {
    cache.invalidate("Query", 'posts', fi.arguments || {})
  })
}

export const createUrqlClient = (ssrExchange: any, ctx: any) => {

  let cookie = ''
  if (isServer()) {
    cookie = ctx?.req?.headers?.cookie
  }

  return {
    url: "http://localhost:4000/graphql",
    fetchOptions: {
      credentials: "include" as const,
      headers: cookie ? { cookie } : undefined
    },
    exchanges: [
      dedupExchange,
      cacheExchange({
        keys: {
          PaginatedPosts: () => null
        },
        resolvers: {
          Query: {
            posts: cursorPagination(), // a chave(posts) desse atributo deve ser o mesmo nome do resolver correspondente
          }
        },
        updates: {
          Mutation: {
            deletePost: (_result, args, cache, info) => {
              cache.invalidate({
                __typename: "Post",
                id: (args as DeletePostMutationVariables).id
              })
            },
            vote: (_result, args, cache, info) => {
              const { postId, value } = args as VoteMutationVariables

              const data = cache.readFragment(
                gql`
                fragment _ on Post {
                  id
                  points
                  voteStatus
                }
              `,
                { id: postId } as any
              )
              console.log('data: ', data)
              if (data) {
                if (data.voteStatus === value) {
                  // se o voteStatus novo é igual ao anterior
                  return
                }
                const newPoints = (data.points as number) + ((!data.voteStatus ? 1 : 2) * value)
                cache.writeFragment(
                  gql`
                  fragment _ on Post {
                    points
                    voteStatus
                  }
                `,
                  { id: postId, points: newPoints, voteStatus: value } as any
                )

              }
            },
            createPost: (_result, args, cache, info) => {
              invalidateAllPosts(cache)
              // vamos invalidar o post recem feito para ele ser buscado novamente, assim atualizando a home page
            },
            logout: (_result, args, cache, info) => {
              betterUpdateQuery<LogoutMutation, MeQuery>(
                cache,
                { query: MeDocument },
                _result,
                () => ({ me: null })
              )
            },
            login: (_result, args, cache, info) => {
              betterUpdateQuery<LoginMutation, MeQuery>(cache,
                { query: MeDocument },
                _result,
                (result, query) => {
                  if (result.login.errors) {
                    return query
                  } else {
                    return {
                      me: result.login.user
                    }
                  }
                }
              )
              invalidateAllPosts(cache)
            },
            register: (_result, args, cache, info) => {
              betterUpdateQuery<RegisterMutation, MeQuery>(cache,
                { query: MeDocument },
                _result,
                (result, query) => {
                  if (result.register.errors) {
                    return query
                  } else {
                    return {
                      me: result.register.user
                    }
                  }
                }
              )
            },
          }
        }
      }),
      errorExchange,
      ssrExchange,
      fetchExchange
    ],
  }
}