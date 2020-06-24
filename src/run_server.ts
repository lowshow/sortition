#!/usr/bin/env node

import { main, FinishState } from "./main"
import process from "process"
import path from "path"
import fs from "fs"

// TODO: add doc
export type EndEvent = NodeJS.Signals | "uncaughtException"

// TODO: add doc
interface State {
    port: number
    rootDir: string
    onExit: (() => Promise<void>)[]
}

process.stdin.resume()

// TODO: add doc
function setProcessListener(onExit: () => (() => Promise<void>)[]): void {
    ;(process as NodeJS.EventEmitter).on("exit", (exitCode: number): void => {
        Promise.all(
            onExit().map((fn: () => Promise<void>): Promise<void> => fn())
        ).then((): void => {
            if (exitCode !== 0) {
                console.warn("Program exited early.")
            }
        })
    })
    ;([
        "SIGINT",
        "SIGTERM",
        "SIGUSR1",
        "SIGUSR2",
        "uncaughtException"
    ] as EndEvent[]).map((event: EndEvent): void => {
        ;(process as NodeJS.EventEmitter).on(event, (): void => {
            process.exit(1)
        })
    })
}

// TODO: add doc
function parsePort(maybePort?: string): number {
    if (!maybePort) {
        throw Error("No port")
    }

    try {
        return parseInt(maybePort, 10)
    } catch {
        throw Error("Invalid port value type")
    }
}

// TODO: add doc
function parsePath(maybePath?: string): string {
    if (!maybePath) {
        throw Error("No path")
    }

    try {
        return path.resolve(maybePath)
    } catch {
        throw Error("Invalid file path")
    }
}

// TODO: add doc
// arg 1 = port
// arg 2 = dbPath
function run(): void {
    const state: State = {
        port: parsePort(process.argv.slice(2)[0]),
        rootDir: parsePath(process.argv.slice(2)[1]),
        onExit: []
    }

    const dbPath: string = path.join(state.rootDir, "db")
    if (!fs.existsSync(dbPath)) {
        fs.closeSync(fs.openSync(dbPath, "w"))
    }

    setProcessListener((): (() => Promise<void>)[] => state.onExit)

    main(state.port, dbPath, (fn: () => Promise<void>): void => {
        state.onExit.push(fn)
    })
        .then((res: FinishState | void): void => {
            switch (res) {
                case FinishState.EXIT_BAD_KILL:
                    process.exit(1)
                case FinishState.EXIT_BAD_NO_KILL:
                    process.exit(2)
                case FinishState.EXIT_OK:
                    process.exit(0)
                default:
                    break
            }
        })
        .catch((error: string): void => {
            console.error(error)
            process.exit(1)
        })
}

run()
