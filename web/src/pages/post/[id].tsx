import { Box, Flex, Heading } from '@chakra-ui/layout';
import { withUrqlClient } from 'next-urql';
import EditDeletePostButtons from '../../components/EditDeletePostButtons';
import { Layout } from '../../components/Layout';
import { createUrqlClient } from '../../utils/createUrqlClient';
import { useGetPostFromUrl } from '../../utils/useGetPostFromUrl';


const Post = ({}) => {
    const [{ data, error, fetching}] = useGetPostFromUrl()

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
            <Flex align="flex-end" mt={5}>
                <EditDeletePostButtons id={data.post.id} creatorId={data.post.creator.id} />
            </Flex>
        </Layout>
    );
}

export default withUrqlClient(createUrqlClient, { ssr: true })(Post)