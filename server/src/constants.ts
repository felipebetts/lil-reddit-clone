
//a variavel de ambiente process.env.NODE_ENV diz se estamos em ambiente de producao ou desenvolvimento retornando uma string,
// abaixo se a string retornada for = "production" debug vai ser false, e se for diferente será true
export const __prod__ = process.env.NODE_ENV !== 'production'
export const COOKIE_NAME = "qid"
export const FORGET_PASSWORD_PREFIX = "forget-password:"