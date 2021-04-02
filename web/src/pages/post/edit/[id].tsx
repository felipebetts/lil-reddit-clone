import { Box, Button } from "@chakra-ui/react";
import { Formik, Form } from "formik";
import { withUrqlClient } from "next-urql";
import { useRouter } from "next/router";
import React from "react";
import InputField from "../../../components/InputField";
import { Layout } from "../../../components/Layout";
import { useUpdatePostMutation } from "../../../generated/graphql";
import { createUrqlClient } from "../../../utils/createUrqlClient";
import { useGetPostFromUrl } from "../../../utils/useGetPostFromUrl";


const EditPost = ({}) => {

    const router = useRouter()

    const [{ data, fetching}] = useGetPostFromUrl()
    const [{}, updatePost] = useUpdatePostMutation()

    if (fetching) {
        return (
            <Layout>
                <Box>loading ...</Box>
            </Layout>
        )
    }

    if (!data?.post) {
        return (
            <Layout>
                <Box>
                    Não foi possível encontrar o post
                </Box>
            </Layout>
        )
    }


    return (
        <Layout variant="small">
            <Formik 
                initialValues={{ title: data.post.title, text: data.post.text }}
                onSubmit={async (values, { setErrors }) => {
                    await updatePost({ id: data!.post!.id, ...values })
                    router.back()
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
                            Atualizar Post
                        </Button>
                    </Form>
                )}
            </Formik>
        </Layout>
    );
}

export default withUrqlClient(createUrqlClient)(EditPost)