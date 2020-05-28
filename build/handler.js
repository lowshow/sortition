"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuidv4_1 = require("uuidv4");
// TODO: add doc
function onDelete(_, response, __) {
    response.writeHead(200);
    response.end();
}
// TODO: add doc
// TODO: validate the icecast endpoint, if not valid, add IP to warning list, >2 warnings ban, ensure this doesn't spam servers
function validateAdd(request) {
    return new Promise((resolve, reject) => {
        const { headers } = request;
        const type = headers["content-type"] || "";
        const size = parseInt(headers["content-length"] || "1025", 10);
        let downloaded = 0;
        if (headers["content-type"] !== "text/plain") {
            reject(`Incorrect content type ${type}`);
        }
        else if (size > 1024) {
            reject("Too much data");
        }
        else {
            const data = [];
            request.setEncoding("utf8");
            request.on("data", (chunk) => {
                downloaded += chunk.length;
                data.push(chunk);
                if (downloaded > 1024) {
                    request.destroy(Error("Too much data"));
                    reject("Too much data");
                }
            });
            request.on("end", () => {
                try {
                    resolve(data.join(""));
                }
                catch (error) {
                    reject("Error parsing data");
                }
            });
        }
    });
}
// TODO: add doc
function validateDelete(request) {
    return new Promise((resolve, reject) => {
        const { headers } = request;
        const type = headers["content-type"] || "";
        const size = parseInt(headers["content-length"] || "37", 10);
        let downloaded = 0;
        if (headers["content-type"] !== "text/plain") {
            reject(`Incorrect content type ${type}`);
        }
        else if (size > 36) {
            reject("Too much data");
        }
        else {
            const data = [];
            request.setEncoding("utf8");
            request.on("data", (chunk) => {
                downloaded += chunk.length;
                data.push(chunk);
                if (downloaded > 36) {
                    request.destroy(Error("Too much data"));
                    reject("Too much data");
                }
            });
            request.on("end", () => {
                try {
                    const uuid = data.join("");
                    const valid = uuidv4_1.isUuid(uuid);
                    if (!valid) {
                        reject("Invalid data");
                        return;
                    }
                    resolve(uuid);
                }
                catch (error) {
                    reject("Error parsing data");
                }
            });
        }
    });
}
// TODO: add doc
function onAdd(_, response, data) {
    response.writeHead(200, { "Content-Type": "text/plain" });
    response.write(data.id);
    response.end();
}
// TODO: add doc
// TODO: send message to url to see if ok to redirect and also check if alive/add request IP to their "whitelist", then redirect
// TODO: check if user is requesting in < 5 second intervals, if so, add warning, then ban if > 2 warnings and issue black list message to icecast
function onGet(_, response, data) {
    if (data.content !== "") {
        response.writeHead(302, {
            Location: data.content
        });
    }
    response.end();
}
function urlHandler() {
    return {
        onDelete,
        onAdd,
        onGet,
        validateAdd,
        validateDelete
    };
}
exports.urlHandler = urlHandler;
