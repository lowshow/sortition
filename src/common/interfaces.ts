import { IncomingMessage, ServerResponse } from "http"

// TODO: add doc
export type Resolve<T> = (value?: T | PromiseLike<T> | undefined) => void

// TODO: add doc
export type Reject = (reason?: any) => void

// TODO: add doc
export type Maybe<T> = T | void

// TODO: add doc
export type ValueOf<T> = T[keyof T]

// TODO: add doc
export interface Hub {
    id: string
    created: number
    active: number
}

// TODO: add doc
export interface DataItem {
    id: string
    hub_id: string
    added: number
    active: number
    count: number
    content: any
}

// TODO: add doc
type HandlerFn = (
    request: IncomingMessage,
    response: ServerResponse,
    data: DataItem
) => void

// TODO: add doc
type HandlerValidateFn = (request: IncomingMessage) => Promise<any>

// TODO: add doc
export interface Handler {
    onDelete: HandlerFn
    onGet: HandlerFn
    onAdd: HandlerFn
    validateAdd: HandlerValidateFn
    validateDelete: HandlerValidateFn
}
