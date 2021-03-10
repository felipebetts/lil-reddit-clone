import React from 'react'
import { Form, Formik } from 'formik'
import { Box, Button } from '@chakra-ui/react';
import { Wrapper } from '../components/Wrapper';
import InputField from '../components/InputField';
import { useMutation } from 'urql';
import { useRegisterMutation } from '../generated/graphql';
import { toErrorMap } from '../utils/toErrorMap';
import { useRouter } from 'next/router'

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

const Register: React.FC<registerProps> = ({}) => {

    // const [{}, register] = useMutation(REGISTER_MUTATION) // hook importado do urql que realizará uma mutation graphql

    const [{}, register] = useRegisterMutation() // esse hook fará mais ou menos o mesmo que useMutation
    // o hook acima foi gerado automaticamente pelo graphql-codegen usando o script yarn gen apos a mutation ter
    // sido escrita na pasta de mutations dentro da pasta de graphql

    const router = useRouter()

    return (
        <Wrapper variant="small">
            <Formik 
                initialValues={{ username: "", password: "" }}
                onSubmit={async (values, { setErrors }) => {
                    const response = await register(values)
                    // console.log(await response)
                    if (response.data?.register.errors) {
                        setErrors(toErrorMap(response.data.register.errors)) // isso irá trazer a mensagem de erro enviada pelo servidor
                    } else if (response.data?.register.user) {
                        // cadastro funcionou!
                        router.push("/") // essa linha manda a url para a origem ( '/' )
                    }

                    // se a chave dos values for diferente da chave passada na mutation, o register terá que ser chamdo da seguinte forma:
                    // register({username: values.chaveCorrespondente, password: values.chaveCorrespondente})
                }}
            >
                {({ isSubmitting }) => (
                    <Form>
                        <InputField 
                            name="username" 
                            placeholder="username" 
                            label="Username" 
                        />
                        <Box mt={4}>
                            <InputField 
                                name="password" 
                                placeholder="password" 
                                label="Password" 
                                type="password"
                            />
                        </Box>
                        <Button 
                            mt={4} 
                            type="submit" 
                            colorScheme="teal" 
                            variant="solid" 
                            isLoading={isSubmitting}
                        >
                            Register
                        </Button>
                    </Form>
                )}
            </Formik>
        </Wrapper>
    );
}

export default Register