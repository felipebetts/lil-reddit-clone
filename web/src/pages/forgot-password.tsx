import { Box, Flex, Link, Button } from '@chakra-ui/react';
import { Formik, Form } from 'formik';
import { withUrqlClient } from 'next-urql';
import router from 'next/router';
import React, { useState } from 'react'
import InputField from '../components/InputField';
import { Wrapper } from '../components/Wrapper';
import { createUrqlClient } from '../utils/createUrqlClient';
import { toErrorMap } from '../utils/toErrorMap';
import login from './login';
import { useForgotPasswordMutation } from '../generated/graphql'


const ForgotPassword: React.FC<{}> = ({}) => {

    const [complete, setComplete] = useState(false)
    const [, forgotPassword] = useForgotPasswordMutation()

    return (
        <Wrapper variant="small">
            <Formik 
                initialValues={{ email: "" }}
                onSubmit={async (values, { setErrors }) => {
                    await forgotPassword(values)
                    setComplete(true)
                }}
            >
                {({ isSubmitting }) => complete ? 
                    (<Box>
                        Um email de recuperação de senha foi enviado para você.
                    </Box>) : (
                    <Form>
                        <InputField 
                            name="email" 
                            placeholder="email" 
                            label="Email" 
                            type="email"
                        />
                        <Button 
                            mt={4} 
                            type="submit" 
                            colorScheme="teal" 
                            variant="solid" 
                            isLoading={isSubmitting}
                        >
                            Esqueci a senha
                        </Button>
                    </Form>
                )}
            </Formik>
        </Wrapper>
    );
}

export default withUrqlClient(createUrqlClient)(ForgotPassword)