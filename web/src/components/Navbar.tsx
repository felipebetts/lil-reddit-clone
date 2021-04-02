import { Box, Flex, Heading, Link } from '@chakra-ui/layout';
import React from 'react'
import NextLink from "next/link";
import { useLogoutMutation, useMeQuery } from '../generated/graphql'
import { Button } from '@chakra-ui/button';
import { isServer } from '../utils/isServer';
import { useRouter } from 'next/router';

interface NavbarProps {

}

export const Navbar: React.FC<NavbarProps> = ({ }) => {

    const router = useRouter()

    const [{ fetching: logoutFetching }, logout] = useLogoutMutation() // aqui estamos extraindo o fetching como logoutFetching, para evitar conflitos de nome de variaveis
    const [{ data, fetching }] = useMeQuery({
        pause: isServer() // com isso nós retiramos o ssr do mequery
    })

    let body

    if (fetching) { // dados estão carregando
        body = null
    } else if (!data?.me) { // usuario nao está logado
        body = (
            <>
                <NextLink href="/login">
                    <Link color="white" mr={2}>login</Link>
                </NextLink>
                <NextLink href="/register">
                    <Link color="white">register</Link>
                </NextLink>
            </>
        )
    } else { // usuário está logado
        body = (
            <Flex align="center">
                <Button as={Link} variant="outline" mr={2}>
                    <NextLink href="/create-post">
                        Criar Post
                    </NextLink>
                </Button>
                <Box mr={3} color="white">{data.me.username}</Box>
                <Button
                    variant="link"
                    onClick={async () => {
                        await logout()
                        router.reload()
                    }}
                    isLoading={logoutFetching}
                >
                    logout
                </Button>
            </Flex>
        )
    }

    return (
        <Flex
            zIndex={1}
            position="sticky"
            top={0} bg="teal"
            p={4}
        >
            <Flex 
                alignItems="center"
                maxW={800}
                flex={1}
                m="auto"
            >
                <NextLink href="/">
                    <Link color="white">
                        <Heading>MyReddit</Heading>
                    </Link>
                </NextLink>
                <Box ml="auto">{body}</Box>
            </Flex>
        </Flex>
    );
}