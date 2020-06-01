"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const uuidv4_1 = require("uuidv4");
const sqlite3_1 = require("sqlite3");
const db_1 = require("./db");
const handler_1 = require("./handler");
const utils_1 = require("./common/utils");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
// TODO: add doc
var FinishState;
(function (FinishState) {
    FinishState["EXIT_BAD_NO_KILL"] = "EXIT_BAD_NO_KILL";
    FinishState["EXIT_BAD_KILL"] = "EXIT_BAD_KILL";
    FinishState["EXIT_OK"] = "EXIT_OK";
})(FinishState = exports.FinishState || (exports.FinishState = {}));
// TODO: add doc
function handleBaseRequests(request, response, dbActions, html) {
    switch (request.method) {
        case "GET":
            response.writeHead(200, { "Content-Type": "text/html" });
            response.write(html);
            response.end();
            break;
        case "POST":
            dbActions
                .createHub()
                .then((hub) => {
                response.writeHead(200, {
                    "Content-Type": "text/plain"
                });
                response.write(hub.id);
                response.end();
            })
                .catch((err) => {
                response.writeHead(500, { "Content-Type": "text/plain" });
                response.write(err.message);
                response.end();
            });
            break;
        case "OPTIONS":
            response.writeHead(200);
            response.end();
        default:
            response.statusCode = 405;
            response.statusMessage = `Not handled: ${request.method}`;
            response.end();
    }
}
// TODO: add doc
function handleHubRequests(request, response, dbActions, hubId, handlers) {
    switch (request.method) {
        case "GET":
            dbActions
                .getData(hubId)
                .then((data) => {
                handlers[0].onGet(request, response, data);
            })
                .catch((err) => {
                response.statusCode = 400;
                response.statusMessage = err.message;
                response.end();
            });
            break;
        case "PUT":
            handlers[0]
                .validateAdd(request)
                .then((data) => dbActions.addData(hubId, data))
                .then((data) => {
                handlers[0].onAdd(request, response, data);
            })
                .catch((err) => {
                response.statusCode = 400;
                response.statusMessage =
                    err.message ||
                        err ||
                        "Bad request";
                response.end();
            });
            break;
        case "DELETE":
            handlers[0]
                .validateDelete(request)
                .then((data) => dbActions.deactivateData(data))
                .then((data) => {
                handlers[0].onDelete(request, response, data);
            })
                .catch((err) => {
                response.statusCode = 400;
                response.statusMessage = err.message;
                response.end();
            });
            break;
        case "OPTIONS":
            response.writeHead(200);
            response.end();
        default:
            response.statusCode = 405;
            response.statusMessage = `${request.method}`;
            response.end();
    }
}
// TODO: add doc
function setCors(response) {
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Request-Method", "*");
    response.setHeader("Access-Control-Allow-Methods", "OPTIONS, GET, PUT, DELETE");
    response.setHeader("Access-Control-Allow-Headers", "*");
}
// TODO: add doc
function requestListener(dbActions, handlers, html) {
    return (request, response) => {
        const { url } = request;
        if (!url || url.length > 1024) {
            response.statusCode = 404;
            response.statusMessage = "Invalid path";
            response.end();
        }
        else if (url === "/") {
            handleBaseRequests(request, response, dbActions, html);
        }
        else {
            setCors(response);
            const uuid = url.split("/")[1];
            const valid = uuidv4_1.isUuid(uuid);
            if (!valid) {
                response.statusCode = 404;
                response.statusMessage = "Invalid path";
                response.end();
                return;
            }
            handleHubRequests(request, response, dbActions, uuid, handlers);
        }
    };
}
// TODO: add doc
async function main(port, dbPath, onExit) {
    try {
        fs_1.readFile(path_1.default.resolve(__dirname, "..", "static", "page.html"), { encoding: "utf8" }, (err, html) => {
            if (err)
                throw err;
            const handlers = [handler_1.urlHandler()];
            const db = new sqlite3_1.Database(dbPath);
            const server = http_1.createServer(requestListener(db_1.getDBActions(db_1.initDb(db)), handlers, html));
            server.keepAliveTimeout = 0;
            onExit(async () => {
                console.log("\nClosing server and DB");
                server.on("connection", (socket) => {
                    socket.end("", () => {
                        socket.destroy();
                    });
                });
                let count = 0;
                while (server.connections > 0) {
                    if (count > 4) {
                        break;
                    }
                    await utils_1.sleep(0.2);
                    count += 1;
                }
                server.close();
                console.log("Server closed");
                db.close();
                console.log("DB closed");
            });
            server.listen(port, "127.0.0.1");
        });
    }
    catch (error) {
        console.error(error);
        return FinishState.EXIT_BAD_KILL;
    }
}
exports.main = main;
