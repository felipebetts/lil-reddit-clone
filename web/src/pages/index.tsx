import { withUrqlClient } from "next-urql"
import { createUrqlClient } from "../utils/createUrqlClient"
import { usePostsQuery } from '../generated/graphql'
import { Layout } from "../components/Layout"
import NextLink from 'next/link'
import React, { useState } from "react"
import { Link, Stack, Box, Heading, Text, Flex, Button } from "@chakra-ui/react"


const Index = () => {

  const [variables, setVariables] = useState({
    limit: 10,
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
      <Flex align="center">
        <Heading>MyReddit</Heading>
        <NextLink href="/create-post">
          <Link ml="auto">Criar Post</Link>
        </NextLink>
      </Flex>
      <br/>
      <hr/>
      { !data && fetching ? (
        <div>loading ...</div>
      ) : (
        <Stack spacing={8}>
            {data!.posts.posts.map(post => (
              <Box key={post.id} p={5} shadow="md" borderWidth="1px">
                <Flex>
                  <Heading fontSize="xl">{post.title}</Heading>
                  <Box ml="auto">{post.creatorId}</Box>
                </Flex>
                <Text mt={4}>{post.textSnippet}</Text>
              </Box>
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