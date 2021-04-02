import { Link, Box, IconButton } from "@chakra-ui/react"
import NextLink from "next/link"
import React from "react"
import { DeleteIcon, EditIcon } from "@chakra-ui/icons"
import { useDeletePostMutation, useMeQuery } from "../generated/graphql"

interface EditDeletePostButtonsProps {
    id: number
    creatorId: number
}

const EditDeletePostButtons: React.FC<EditDeletePostButtonsProps> = ({ id, creatorId }) => {

    const [{ }, deletePost] = useDeletePostMutation()

    const [{ data: meData }] = useMeQuery() // não há problema chamar essa query em vários componentes pois o urql está guardando-o em cache


    if (meData?.me?.id !== creatorId) {
        return null
    }

    return (
        <>
            <NextLink href="/post/edit/[id]" as={`/post/edit/${id}`}>
                <IconButton
                    as={Link}
                    aria-label="deletar post"
                    icon={<EditIcon />}
                    mr={4}
                />
            </NextLink>
            <IconButton
                aria-label="deletar post"
                icon={<DeleteIcon />}
                onClick={() => {
                    deletePost({ id })
                }}
            />
        </>
    )
}

export default EditDeletePostButtons