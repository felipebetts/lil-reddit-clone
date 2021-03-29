import { ArrowUpIcon, ArrowDownIcon } from '@chakra-ui/icons';
import { Flex, IconButton } from '@chakra-ui/react';
import React from 'react'
import { PostSnippetFragment, PostsQuery } from '../generated/graphql';
import { useVoteMutation} from '../generated/graphql'

interface UpdootSectionProps {
    post: PostSnippetFragment
}

export const UpdootSection: React.FC<UpdootSectionProps> = ({ post }) => {

    const [, vote] = useVoteMutation()

    return (
        <Flex
            direction="column"
            alignItems="center"
            justifyContent="center"
            mr={4}
        >
            <IconButton
                // variant="outline"
                // colorScheme="facebook"
                aria-label="Vote UP"
                icon={<ArrowUpIcon />}
                onClick={() => vote({
                    postId: post.id,
                    value: 1
                })}
            />
            {post.points}
            <IconButton
                // variant="outline"
                // colorScheme="teal"
                aria-label="Vote DOWN"
                icon={<ArrowDownIcon />}
                onClick={() => vote({
                    postId: post.id,
                    value: -1
                })}
            />
        </Flex>
    );
}