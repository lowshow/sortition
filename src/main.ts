import { createServer, Server, IncomingMessage, ServerResponse } from "http"
import { Handler, DataItem, Hub } from "./common/interfaces"
import { isUuid } from "uuidv4"
import { Database } from "sqlite3"
import { initDb, DBActions, getDBActions } from "./db"
import { urlHandler } from "./handler"
import { sleep } from "./common/utils"
import { Socket } from "net"

// TODO: add doc
export enum FinishState {
    EXIT_BAD_NO_KILL = "EXIT_BAD_NO_KILL",
    EXIT_BAD_KILL = "EXIT_BAD_KILL",
    EXIT_OK = "EXIT_OK"
}

// TODO: add doc
function handleBaseRequests(
    request: IncomingMessage,
    response: ServerResponse,
    dbActions: DBActions
): void {
    switch (request.method) {
        case "POST":
            dbActions
                .createHub()
                .then((hub: Hub): void => {
                    response.writeHead(200, {
                        "Content-Type": "text/plain"
                    })
                    response.write(hub.id)
                    response.end()
                })
                .catch((err: Error): void => {
                    response.writeHead(500, { "Content-Type": "text/plain" })
                    response.write(err.message)
                    response.end()
                })
            break
        case "OPTIONS":
            response.writeHead(200)
            response.end()
        default:
            response.statusCode = 405
            response.statusMessage = `Not handled: ${request.method}`
            response.end()
    }
}

// TODO: add doc
function handleHubRequests(
    request: IncomingMessage,
    response: ServerResponse,
    dbActions: DBActions,
    hubId: string,
    handlers: Handler[]
): void {
    switch (request.method) {
        case "GET":
            dbActions
                .getData(hubId)
                .then((data: DataItem): void => {
                    handlers[0].onGet(request, response, data)
                })
                .catch((err: Error): void => {
                    response.statusCode = 400
                    response.statusMessage = err.message
                    response.end()
                })
            break
        case "PUT":
            handlers[0]
                .validateAdd(request)
                .then(
                    (data: any): Promise<DataItem> =>
                        dbActions.addData(hubId, data)
                )
                .then((data: DataItem): void => {
                    handlers[0].onAdd(request, response, data)
                })
                .catch((err: Error | string): void => {
                    response.statusCode = 400
                    response.statusMessage =
                        (err as Error).message ||
                        (err as string) ||
                        "Bad request"
                    response.end()
                })
            break
        case "DELETE":
            handlers[0]
                .validateDelete(request)
                .then(
                    (data: any): Promise<DataItem> =>
                        dbActions.deactivateData(data)
                )
                .then((data: DataItem): void => {
                    handlers[0].onDelete(request, response, data)
                })
                .catch((err: Error): void => {
                    response.statusCode = 400
                    response.statusMessage = err.message
                    response.end()
                })
            break
        case "OPTIONS":
            response.writeHead(200)
            response.end()
        default:
            response.statusCode = 405
            response.statusMessage = `${request.method}`
            response.end()
    }
}

// TODO: add doc
function setCors(response: ServerResponse): void {
    response.setHeader("Access-Control-Allow-Origin", "*")
    response.setHeader("Access-Control-Request-Method", "*")
    response.setHeader(
        "Access-Control-Allow-Methods",
        "OPTIONS, GET, PUT, DELETE"
    )
    response.setHeader("Access-Control-Allow-Headers", "*")
}

// TODO: add doc
function requestListener(
    dbActions: DBActions,
    handlers: Handler[]
): (request: IncomingMessage, response: ServerResponse) => void {
    return (request: IncomingMessage, response: ServerResponse): void => {
        const { url }: IncomingMessage = request
        if (!url || url.length > 1024) {
            response.statusCode = 404
            response.statusMessage = "Invalid path"
            response.end()
        } else if (url === "/create") {
            handleBaseRequests(request, response, dbActions)
        } else {
            setCors(response)
            const uuid: string = url.split("/")[1]
            const valid: boolean = isUuid(uuid)
            if (!valid) {
                response.statusCode = 404
                response.statusMessage = "Invalid path"
                response.end()
                return
            }
            handleHubRequests(request, response, dbActions, uuid, handlers)
        }
    }
}

// TODO: add doc
export async function main(
    port: number,
    dbPath: string,
    onExit: (fn: () => Promise<void>) => void
): Promise<FinishState | void> {
    try {
        const handlers: Handler[] = [urlHandler()]

        const db: Database = new Database(dbPath)

        const server: Server = createServer(
            requestListener(getDBActions(initDb(db)), handlers)
        )
        server.keepAliveTimeout = 0

        onExit(
            async (): Promise<void> => {
                console.log("\nClosing server and DB")
                server.on("connection", (socket: Socket): void => {
                    socket.end("", (): void => {
                        socket.destroy()
                    })
                })
                let count: number = 0
                while (server.connections > 0) {
                    if (count > 4) {
                        break
                    }
                    await sleep(0.2)
                    count += 1
                }
                server.close()
                console.log("Server closed")
                db.close()
                console.log("DB closed")
            }
        )

        server.listen(port, "127.0.0.1")
    } catch (error) {
        console.error(error)
        return FinishState.EXIT_BAD_KILL
    }
}
