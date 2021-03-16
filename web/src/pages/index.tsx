import { withUrqlClient } from "next-urql"
import { createUrqlClient } from "../utils/createUrqlClient"
import { usePostsQuery } from '../generated/graphql'
import { Layout } from "../components/Layout"
import { Link } from "@chakra-ui/layout"
import NextLink from 'next/link'


const Index = () => {

  const [{data}] = usePostsQuery({ // em data serão armazenados todos os posts do site
    variables: {
      limit: 10,
    }
  }) 

  return (
    <Layout>
      <NextLink href="/create-post">
        <Link>Criar Post</Link>
      </NextLink>
      <br/>
      <hr/>
      { !data ? <div>loading ...</div> : data.posts.map(post => (
        <div key={post.id}>{post.title}</div>
      ))}
    </Layout>
  )
}

export default withUrqlClient(createUrqlClient, { ssr: true })(Index)
