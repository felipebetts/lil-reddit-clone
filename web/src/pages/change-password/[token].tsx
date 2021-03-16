import { Alert, AlertDescription, AlertIcon, AlertTitle, Box, Button, CloseButton, Flex, Link } from "@chakra-ui/react";
import { Formik, Form } from "formik";
import { NextPage } from "next";
import { useRouter } from "next/router";
import React, { useState } from "react";
import InputField from "../../components/InputField";
import { Wrapper } from "../../components/Wrapper";
import { toErrorMap } from "../../utils/toErrorMap";
import login from "../login";
import { useChangePasswordMutation } from "../../generated/graphql"
import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../../utils/createUrqlClient";
import NextLink from 'next/link'

const ChangePassword: NextPage = () => {

    const [{ }, changePassword] = useChangePasswordMutation()
    const router = useRouter()
    const [tokenError, setTokenError] = useState('')

    return (
        <Wrapper variant="small">
            <Formik
                initialValues={{ newPassword: "" }}
                onSubmit={async (values, { setErrors }) => {
                    const response = await changePassword({ 
                        newPassword: values.newPassword, 
                        token: typeof router.query.token === "string" ? router.query.token : "" 
                    })
                    if (response.data?.changePassword.errors) {
                        const errorMap = toErrorMap(response.data.changePassword.errors)
                        if ('token' in errorMap) {
                            // se houver um erro do token
                            setTokenError(errorMap.token)
                        }
                        setErrors(errorMap) // isso irá trazer a mensagem de erro enviada pelo servidor
                    } else if (response.data?.changePassword.user) {
                        // changePassword funcionou!
                        router.push("/") // essa linha manda a url para a origem ( '/' )
                    }

                    // se a chave dos values for diferente da chave passada na mutation, o register terá que ser chamdo da seguinte forma:
                    // register({username: values.chaveCorrespondente, password: values.chaveCorrespondente})
                }}
            >
                {({ isSubmitting }) => (
                    <Form>
                        <InputField
                            name="newPassword"
                            placeholder="new password"
                            label="New Password"
                            type="password"
                        />
                        { tokenError ? (
                            <Flex>
                                <Box mr={2} color="red">{tokenError}</Box>
                                <NextLink href="/forgot-password">
                                    <Link>Clique aqui para gerar um novo token</Link>
                                </NextLink>
                            </Flex>
                        ) : null }
                        <Button
                            mt={4}
                            type="submit"
                            colorScheme="teal"
                            variant="solid"
                            isLoading={isSubmitting}
                        >
                            Change password
                        </Button>
                    </Form>
                )}
            </Formik>
        </Wrapper>
    )
}


export default withUrqlClient(createUrqlClient)(ChangePassword)