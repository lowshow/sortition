#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const main_1 = require("./main");
const process_1 = __importDefault(require("process"));
const path_1 = __importDefault(require("path"));
process_1.default.stdin.resume();
// TODO: add doc
function setProcessListener(onExit) {
    ;
    process_1.default.on("exit", (exitCode) => {
        Promise.all(onExit().map((fn) => fn())).then(() => {
            if (exitCode !== 0) {
                console.warn("Program exited early.");
            }
        });
    });
    [
        "SIGINT",
        "SIGTERM",
        "SIGUSR1",
        "SIGUSR2",
        "uncaughtException"
    ].map((event) => {
        ;
        process_1.default.on(event, () => {
            process_1.default.exit(1);
        });
    });
}
// TODO: add doc
function parsePort(maybePort) {
    if (!maybePort) {
        throw Error("No port");
    }
    try {
        return parseInt(maybePort, 10);
    }
    catch {
        throw Error("Invalid port value type");
    }
}
// TODO: add doc
function parsePath(maybePath) {
    if (!maybePath) {
        throw Error("No path");
    }
    try {
        return path_1.default.resolve(maybePath);
    }
    catch {
        throw Error("Invalid file path");
    }
}
// TODO: add doc
// arg 1 = port
// arg 2 = dbPath
function run() {
    const state = {
        port: parsePort(process_1.default.argv.slice(2)[0]),
        dbPath: parsePath(process_1.default.argv.slice(2)[1]),
        onExit: []
    };
    setProcessListener(() => state.onExit);
    main_1.main(state.port, state.dbPath, (fn) => {
        state.onExit.push(fn);
    })
        .then((res) => {
        switch (res) {
            case main_1.FinishState.EXIT_BAD_KILL:
                process_1.default.exit(1);
            case main_1.FinishState.EXIT_BAD_NO_KILL:
                process_1.default.exit(2);
            case main_1.FinishState.EXIT_OK:
                process_1.default.exit(0);
            default:
                break;
        }
    })
        .catch((error) => {
        console.error(error);
        process_1.default.exit(1);
    });
}
run();
