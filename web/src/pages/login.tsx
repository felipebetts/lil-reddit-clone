import React from 'react'
import { Form, Formik } from 'formik'
import { Box, Button, Flex, Link } from '@chakra-ui/react';
import { Wrapper } from '../components/Wrapper';
import InputField from '../components/InputField';
import { useLoginMutation } from '../generated/graphql';
import { toErrorMap } from '../utils/toErrorMap';
import { useRouter } from 'next/router'
import { withUrqlClient } from 'next-urql';
import { createUrqlClient } from '../utils/createUrqlClient'; 
import NextLink from "next/link"
// import argon2 from "argon2"


interface registerProps {}

// const REGISTER_MUTATION = `
// mutation Register($username: String!, $password: String!) {
//     register(options: { username: $username, password: $password }) {
//       user {
//         id
//         username
//       }
//       errors {
//         field
//         message
//       }
//     }
//   }  
// `

const Login: React.FC<registerProps> = ({}) => {

    // const [{}, register] = useMutation(REGISTER_MUTATION) // hook importado do urql que realizará uma mutation graphql

    const [{}, login] = useLoginMutation() // esse hook fará mais ou menos o mesmo que useMutation
    // o hook acima foi gerado automaticamente pelo graphql-codegen usando o script yarn gen apos a mutation ter
    // sido escrita na pasta de mutations dentro da pasta de graphql

    const router = useRouter()

    return (
        <Wrapper variant="small">
            <Formik 
                initialValues={{ usernameOrEmail: "", password: "" }}
                onSubmit={async (values, { setErrors }) => {
                    // const hashedPassword = await argon2.hash(values.password) // essa funcao do argon2 retorna a senha encriptografada
                    // values.password = hashedPassword
                    const response = await login(values)
                    // console.log(await response)
                    if (response.data?.login.errors) {
                        setErrors(toErrorMap(response.data.login.errors)) // isso irá trazer a mensagem de erro enviada pelo servidor
                    } else if (response.data?.login.user) {
                        // login funcionou!
                        if (typeof router.query.next === "string") {
                            router.push(router.query.next)
                        } else {
                            router.push("/") // essa linha manda a url para a origem ( '/' )
                        }
                    }

                    // se a chave dos values for diferente da chave passada na mutation, o register terá que ser chamdo da seguinte forma:
                    // register({username: values.chaveCorrespondente, password: values.chaveCorrespondente})
                }}
            >
                {({ isSubmitting }) => (
                    <Form>
                        <InputField 
                            name="usernameOrEmail" 
                            placeholder="username or email" 
                            label="Username or Email" 
                        />
                        <Box mt={4}>
                            <InputField 
                                name="password" 
                                placeholder="password" 
                                label="Password" 
                                type="password"
                            />
                        </Box>
                        <Flex mt={2}>
                            <NextLink href="/forgot-password">
                                <Link ml="auto">Esqueceu sua senha?</Link>
                            </NextLink>
                        </Flex>
                        <Button 
                            mt={4} 
                            type="submit" 
                            colorScheme="teal" 
                            variant="solid" 
                            isLoading={isSubmitting}
                        >
                            Login
                        </Button>
                    </Form>
                )}
            </Formik>
        </Wrapper>
    );
}

// precisamos envolver a pagina de login no urql client para podermos acessar as funcoes do graphql
export default withUrqlClient(createUrqlClient)(Login)