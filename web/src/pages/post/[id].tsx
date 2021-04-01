import { Box, Heading } from '@chakra-ui/layout';
import { withUrqlClient } from 'next-urql';
import { useRouter } from 'next/router';
import { Layout } from '../../components/Layout';
import { usePostQuery } from '../../generated/graphql';
import { createUrqlClient } from '../../utils/createUrqlClient';


const Post = ({}) => {
    const router = useRouter()
    const intId = typeof router.query.id === 'string' ? parseInt(router.query.id) : -1
    const [{ data, error, fetching}] = usePostQuery({
        pause: intId === -1,
        variables: {
            id: intId
        }
    })

    if (fetching) {
        return (
            <Layout>
                <Box>loading...</Box>
            </Layout>
        )
    }

    if (error) {
        return <Box>{error.message}s</Box>
    }

    if (!data?.post) {
        return (
            <Layout>
                <Box>Não foi possível encontrar o post.</Box>
            </Layout>
        )
    }

    return (
        <Layout>
            <Heading mb={4}>{data.post.title}</Heading>
            {data?.post?.text}
        </Layout>
    );
}

export default withUrqlClient(createUrqlClient, { ssr: true })(Post)