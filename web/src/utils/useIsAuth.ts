import { useRouter } from "next/router"
import { useEffect } from "react"
import { useMeQuery } from "../generated/graphql"

export const useisAuth = () => {
    const [{ data, fetching }] = useMeQuery()

    const router = useRouter()

    useEffect(() => {
        if (!fetching && !data?.me) {
            router.replace("/login?next=" + router.pathname)
            // quando adicionamos o ?next= + router.pathname, estamos redirecionando o usuário para onde ele queria ir originalmente
            // é preciso ler e utilizar esse parametro next passado na pagina de login, para realizar o redirecionamento apos o login
        }
    }, [fetching, data, router])
}