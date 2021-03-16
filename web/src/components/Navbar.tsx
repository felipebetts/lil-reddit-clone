import { Box, Flex, Link } from '@chakra-ui/layout';
import React from 'react'
import NextLink from "next/link";
import { useLogoutMutation, useMeQuery } from '../generated/graphql'
import { Button } from '@chakra-ui/button';
import { isServer } from '../utils/isServer';

interface NavbarProps {

}

export const Navbar: React.FC<NavbarProps> = ({}) => {

    const [{ fetching: logoutFetching }, logout] = useLogoutMutation() // aqui estamos extraindo o fetching como logoutFetching, para evitar conflitos de nome de variaveis
    const [{data, fetching}] = useMeQuery({
        pause: isServer() // com isso nós retiramos o ssr do mequery
    })
    
    let body

    if (fetching) { // dados estão carregando
        body = null
    } else if (!data?.me) { // usuario nao está logado
        body = (
            <>
                <NextLink href="/login">
                <Link mr={2}>login</Link>
                </NextLink>
                <NextLink href="/register">
                    <Link>register</Link>
                </NextLink>
            </>
        )
    } else { // usuário está logado
        body = (
            <Flex>
                <Box mr={3}>{data.me.username}</Box>
                <Button 
                    variant="link"
                    onClick={() => logout()}
                    isLoading={logoutFetching}
                >
                    logout
                </Button>
            </Flex>
        )
    }

    return (
        <Flex zIndex={1} position="sticky" top={0} bg="tan" p={4} >
            <Box ml="auto">{body}</Box>
        </Flex>
    );
}