import { Box, Button } from '@chakra-ui/react';
import { Formik, Form } from 'formik';
import { withUrqlClient } from 'next-urql';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react'
import InputField from '../components/InputField';
import { Layout } from '../components/Layout';
import { useCreatePostMutation, useMeQuery } from '../generated/graphql';
import { createUrqlClient } from '../utils/createUrqlClient';
import { useisAuth } from '../utils/useIsAuth';

const CreatePost: React.FC<{}> = ({}) => {

    const router = useRouter()
    useisAuth()
    const [{}, createPost] = useCreatePostMutation()

    return (
        <Layout variant="small">
            <Formik 
                initialValues={{ title: "", text: "" }}
                onSubmit={async (values, { setErrors }) => {
                    await createPost({ input: values })
                    router.push("/")
                }}
            >
                {({ isSubmitting }) => (
                    <Form>
                        <InputField 
                            name="title" 
                            placeholder="title" 
                            label="Título" 
                        />
                        <Box mt={4}>
                            <InputField 
                                textarea
                                name="text" 
                                placeholder="text..." 
                                label="Texto" 
                            />
                        </Box>
                        <Button 
                            mt={4} 
                            type="submit" 
                            colorScheme="teal" 
                            variant="solid" 
                            isLoading={isSubmitting}
                        >
                            Criar Post
                        </Button>
                    </Form>
                )}
            </Formik>
        </Layout>
    );
}

export default withUrqlClient(createUrqlClient)(CreatePost)