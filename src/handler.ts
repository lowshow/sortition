import { Handler, DataItem, Resolve, Reject } from "./common/interfaces"
import { IncomingMessage, ServerResponse } from "http"
import { isUuid } from "uuidv4"

// TODO: add doc
function onDelete(
    _: IncomingMessage,
    response: ServerResponse,
    __: DataItem
): void {
    response.writeHead(200)
    response.end()
}

// TODO: add doc
// TODO: validate the icecast endpoint, if not valid, add IP to warning list, >2 warnings ban, ensure this doesn't spam servers
function validateAdd(request: IncomingMessage): Promise<string> {
    return new Promise((resolve: Resolve<string>, reject: Reject): void => {
        const { headers }: IncomingMessage = request
        const type: string = headers["content-type"] || ""
        const size: number = parseInt(headers["content-length"] || "101", 10)
        let downloaded: number = 0

        if (headers["content-type"] !== "text/plain") {
            reject(`Incorrect content type ${type}`)
        } else if (size > 100) {
            reject("Too much data")
        } else {
            const data: any[] = []
            request.setEncoding("utf8")
            request.on("data", (chunk: any): void => {
                downloaded += chunk.length
                data.push(chunk)
                if (downloaded > 100) {
                    request.destroy(Error("Too much data"))
                    reject("Too much data")
                }
            })
            request.on("end", (): void => {
                try {
                    resolve(data.join(""))
                } catch (error) {
                    reject("Error parsing data")
                }
            })
        }
    })
}

// TODO: add doc
function validateDelete(request: IncomingMessage): Promise<string> {
    return new Promise((resolve: Resolve<string>, reject: Reject): void => {
        const { headers }: IncomingMessage = request
        const type: string = headers["content-type"] || ""
        const size: number = parseInt(headers["content-length"] || "37", 10)
        let downloaded: number = 0

        if (headers["content-type"] !== "text/plain") {
            reject(`Incorrect content type ${type}`)
        } else if (size > 36) {
            reject("Too much data")
        } else {
            const data: any[] = []
            request.setEncoding("utf8")
            request.on("data", (chunk: any): void => {
                downloaded += chunk.length
                data.push(chunk)
                if (downloaded > 36) {
                    request.destroy(Error("Too much data"))
                    reject("Too much data")
                }
            })
            request.on("end", (): void => {
                try {
                    const uuid: string = data.join("")
                    const valid: boolean = isUuid(uuid)
                    if (!valid) {
                        reject("Invalid data")
                        return
                    }
                    resolve(uuid)
                } catch (error) {
                    reject("Error parsing data")
                }
            })
        }
    })
}

// TODO: add doc
function onAdd(
    _: IncomingMessage,
    response: ServerResponse,
    data: DataItem
): void {
    response.writeHead(200, { "Content-Type": "text/plain" })
    response.write(data.id)
    response.end()
}

// TODO: add doc
// TODO: send message to url to see if ok to redirect and also check if alive/add request IP to their "whitelist", then redirect
// TODO: check if user is requesting in < 5 second intervals, if so, add warning, then ban if > 2 warnings and issue black list message to icecast
function onGet(
    _: IncomingMessage,
    response: ServerResponse,
    data: DataItem
): void {
    if (data.content !== "") {
        response.writeHead(302, {
            Location: data.content
        })
    }
    response.end()
}

export function urlHandler(): Handler {
    return {
        onDelete,
        onAdd,
        onGet,
        validateAdd,
        validateDelete
    }
}
