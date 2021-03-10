import { Box, Flex, Link } from '@chakra-ui/layout';
import React from 'react'
import NextLink from "next/link";
import { useMeQuery } from '../generated/graphql'
import { Button } from '@chakra-ui/button';

interface NavbarProps {

}

export const Navbar: React.FC<NavbarProps> = ({}) => {

    const [{data, fetching}] = useMeQuery()
    
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
                <Button variant="link">logout</Button>
            </Flex>
        )
    }

    return (
        <Flex bg="tan" p={4} >
            <Box ml="auto">{body}</Box>
        </Flex>
    );
}