import { ArrowUpIcon, ArrowDownIcon } from '@chakra-ui/icons';
import { Flex, IconButton } from '@chakra-ui/react';
import React, { useState } from 'react'
import { PostSnippetFragment, PostsQuery } from '../generated/graphql';
import { useVoteMutation} from '../generated/graphql'

interface UpdootSectionProps {
    post: PostSnippetFragment
}

export const UpdootSection: React.FC<UpdootSectionProps> = ({ post }) => {

    const [loadingState, setLoadingState] = useState<'updoot-loading' | 'downdoot-loading' | 'not-loading'>('not-loading')
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
                colorScheme={post.voteStatus === 1 ? "green" : undefined}
                aria-label="Vote UP"
                icon={<ArrowUpIcon />}
                isLoading={ loadingState === 'updoot-loading' }
                onClick={async () => {
                    if ( post.voteStatus === 1) {
                        return
                    }
                    setLoadingState('updoot-loading')
                    await vote({
                        postId: post.id,
                        value: 1
                    })
                    setLoadingState('not-loading')
                }}
            />
            {post.points}
            <IconButton
                // variant="outline"
                colorScheme={post.voteStatus === -1 ? "red" : undefined}
                aria-label="Vote DOWN"
                icon={<ArrowDownIcon />}
                isLoading={ loadingState === 'downdoot-loading' }
                onClick={async () => {
                    if ( post.voteStatus === -1) {
                        return
                    }
                    setLoadingState('downdoot-loading')
                    await vote({
                        postId: post.id,
                        value: -1
                    })
                    setLoadingState('not-loading')
                }}
            />
        </Flex>
    );
}