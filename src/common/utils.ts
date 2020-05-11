import { Resolve } from "./interfaces"
import { existsSync, mkdirSync } from "fs"
import crypto from "crypto"
import http from "http"
import https from "https"
import { URL } from "url"

/**
 * A token for setting long passwords.
 *
 * @returns a random 48 byte hex string
 */
export function token(): string {
    return crypto.randomBytes(48).toString("hex")
}

/**
 * If a directory doesn't exist, create it.
 *
 * **This doesn't ensure the parent directories also exist,
 * and will fail if not.**
 *
 * @param dirPath location of a directory
 * @returns the location of the provided directory
 */
export function createDirIfNew(dirPath: string): string {
    if (typeof dirPath !== "string") {
        throw Error("Path is not a string.")
    }

    if (!existsSync(dirPath)) {
        mkdirSync(dirPath)
    }

    return dirPath
}

/**
 * Helper for removing the first indent when creating
 * string using template quotes as in functions they
 * are indented for readability within the scope.
 *
 * @param text string to un-indent
 * @returns un-indented string
 */
export function noIndent(text: string): string {
    if (typeof text !== "string") {
        throw Error("Text is not a string.")
    }

    return text.replace(/^ {4}/gm, "")
}

/**
 * Promise wrapper for setTimeout.
 *
 * @param seconds duration for timeout
 * @returns promise
 */
export function sleep(seconds: number): Promise<void> {
    if (isNaN(seconds)) {
        throw Error("Seconds is not a number")
    }

    return new Promise<void>((resolve: Resolve<void>): void => {
        setTimeout(resolve, ~~(seconds * 1000))
    })
}

/**
 * Helper for displaying additional error messages when in debug more.
 *
 * @param message normal message to show to users
 * @param debugMessage additional message to show in debug mode
 * @returns error object with correct message content
 */
export function debugError(message: string, debugMessage?: string): Error {
    return process.env.NODE_ENV === "debug"
        ? Error(`${message}\n${debugMessage}`)
        : Error(message)
}

// TODO: add doc
export function unique<T>(value: T, index: number, self: T[]): boolean {
    return self.indexOf(value) === index
}

// TODO: add doc
export function randomInt(from: number, to: number): number {
    if (from > to) return from
    return ~~(Math.random() * (to - from) + from)
}

// TODO: add doc
export function randomToken(): Promise<string> {
    return new Promise((resolve: Resolve<string>): void => {
        crypto.randomBytes(48, (err: Error | null, buffer: Buffer): void => {
            if (err) throw Error("Could not produce token")
            resolve(buffer.toString("hex"))
        })
    })
}

// TODO: add doc
export function get(url: string): Promise<string> {
    return new Promise((resolve: Resolve<string>): void => {
        async function handleResponse(
            response: http.IncomingMessage
        ): Promise<void> {
            switch (response.statusCode) {
                case 301:
                case 302:
                case 303:
                case 307:
                    if (response.headers.location)
                        get(response.headers.location).then(resolve)
                    else throw Error("Redirect with no location")
                    return
                default:
                    break
            }

            const chunks: any[] = []
            response.on("data", (chunk: any): void => {
                chunks.push(chunk)
            })
            response.on("error", (): void => {
                throw Error("Failed receiving response")
            })
            response.on("end", (): void => {
                resolve(chunks.join(""))
            })
        }

        const { hostname, pathname, port, protocol }: URL = new URL(url)
        const request: http.RequestOptions = {
            hostname,
            path: pathname,
            port,
            protocol
        }
        switch (protocol) {
            case "http:":
                http.get(request, handleResponse)
                break
            case "https:":
                https.get(request, handleResponse)
                break
            default:
                throw Error(`Not supported ${protocol}`)
        }
    })
}
