"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const crypto_1 = __importDefault(require("crypto"));
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const url_1 = require("url");
/**
 * A token for setting long passwords.
 *
 * @returns a random 48 byte hex string
 */
function token() {
    return crypto_1.default.randomBytes(48).toString("hex");
}
exports.token = token;
/**
 * If a directory doesn't exist, create it.
 *
 * **This doesn't ensure the parent directories also exist,
 * and will fail if not.**
 *
 * @param dirPath location of a directory
 * @returns the location of the provided directory
 */
function createDirIfNew(dirPath) {
    if (typeof dirPath !== "string") {
        throw Error("Path is not a string.");
    }
    if (!fs_1.existsSync(dirPath)) {
        fs_1.mkdirSync(dirPath);
    }
    return dirPath;
}
exports.createDirIfNew = createDirIfNew;
/**
 * Helper for removing the first indent when creating
 * string using template quotes as in functions they
 * are indented for readability within the scope.
 *
 * @param text string to un-indent
 * @returns un-indented string
 */
function noIndent(text) {
    if (typeof text !== "string") {
        throw Error("Text is not a string.");
    }
    return text.replace(/^ {4}/gm, "");
}
exports.noIndent = noIndent;
/**
 * Promise wrapper for setTimeout.
 *
 * @param seconds duration for timeout
 * @returns promise
 */
function sleep(seconds) {
    if (isNaN(seconds)) {
        throw Error("Seconds is not a number");
    }
    return new Promise((resolve) => {
        setTimeout(resolve, ~~(seconds * 1000));
    });
}
exports.sleep = sleep;
/**
 * Helper for displaying additional error messages when in debug more.
 *
 * @param message normal message to show to users
 * @param debugMessage additional message to show in debug mode
 * @returns error object with correct message content
 */
function debugError(message, debugMessage) {
    return process.env.NODE_ENV === "debug"
        ? Error(`${message}\n${debugMessage}`)
        : Error(message);
}
exports.debugError = debugError;
// TODO: add doc
function unique(value, index, self) {
    return self.indexOf(value) === index;
}
exports.unique = unique;
// TODO: add doc
function randomInt(from, to) {
    if (from > to)
        return from;
    return ~~(Math.random() * (to - from) + from);
}
exports.randomInt = randomInt;
// TODO: add doc
function randomToken() {
    return new Promise((resolve) => {
        crypto_1.default.randomBytes(48, (err, buffer) => {
            if (err)
                throw Error("Could not produce token");
            resolve(buffer.toString("hex"));
        });
    });
}
exports.randomToken = randomToken;
// TODO: add doc
function get(url) {
    return new Promise((resolve) => {
        async function handleResponse(response) {
            switch (response.statusCode) {
                case 301:
                case 302:
                case 303:
                case 307:
                    if (response.headers.location)
                        get(response.headers.location).then(resolve);
                    else
                        throw Error("Redirect with no location");
                    return;
                default:
                    break;
            }
            const chunks = [];
            response.on("data", (chunk) => {
                chunks.push(chunk);
            });
            response.on("error", () => {
                throw Error("Failed receiving response");
            });
            response.on("end", () => {
                resolve(chunks.join(""));
            });
        }
        const { hostname, pathname, port, protocol } = new url_1.URL(url);
        const request = {
            hostname,
            path: pathname,
            port,
            protocol
        };
        switch (protocol) {
            case "http:":
                http_1.default.get(request, handleResponse);
                break;
            case "https:":
                https_1.default.get(request, handleResponse);
                break;
            default:
                throw Error(`Not supported ${protocol}`);
        }
    });
}
exports.get = get;
