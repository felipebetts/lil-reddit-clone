import { withUrqlClient } from "next-urql"
import { createUrqlClient } from "../utils/createUrqlClient"
import {  useMeQuery, usePostsQuery } from '../generated/graphql'
import { Layout } from "../components/Layout"
import NextLink from 'next/link'
import React, { useState } from "react"
import { Link, Stack, Box, Heading, Text, Flex, Button } from "@chakra-ui/react"
import { UpdootSection } from "../components/UpdootSection"
import EditDeletePostButtons from "../components/EditDeletePostButtons"


const Index = () => {

  const [variables, setVariables] = useState({
    limit: 15,
    cursor: null as null | string,
  })


  const [{ data, fetching }] = usePostsQuery({ // em data serão armazenados todos os posts do site
    variables,
  })


  if(!fetching && !data) {
    // se nós nao estamos baixando os dados(fetching) e também não temos os dados ainda, então ocorreu algum erro
    return (
      	<Box>Erro: Busca de posts não foi possível</Box>
    )
  }

  return (
    <Layout>
      { !data && fetching ? (
        <div>loading ...</div>
      ) : (
        <Stack spacing={8}>
            {data!.posts.posts.map(post => !post ? null : (
              <Flex key={post.id} p={5} shadow="md" borderWidth="1px">
                <UpdootSection post={post} />
                <Flex
                  direction="column"
                  flex={1}
                >
                  <NextLink href="/post/[id]" as={`/post/${post.id}`}>
                      <Link>
                        <Heading fontSize="xl">{post.title}</Heading>
                      </Link>
                  </NextLink>
                  <Text fontSize={'0.9rem'}>por {post.creator.username}</Text>
                  <Flex>
                    <Text mt={4}>{post.textSnippet}</Text>
                      <Box ml="auto">
                        <EditDeletePostButtons 
                          id={post.id}
                          creatorId={post.creator.id}
                        />
                      </Box>
                  </Flex>
                </Flex>
              </Flex>
            ))}
        </Stack>
      )}
      {data && data.posts.hasMore ? (
        <Flex>
          <Button 
            isLoading={fetching} 
            m="auto" 
            my={8} 
            colorScheme="teal"
            onClick={() => {
              setVariables({
                limit: variables.limit,
                cursor: data.posts.posts[data.posts.posts.length - 1].createdAt
              })
            }}
            >
              Ver mais
            </Button>
        </Flex>
      ) : null}
    </Layout>
  )
}

export default withUrqlClient(createUrqlClient, { ssr: true })(Index)
