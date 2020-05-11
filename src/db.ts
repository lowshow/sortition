import { Database } from "sqlite3"
import { uuid } from "uuidv4"
import { Resolve, Hub, DataItem } from "./common/interfaces"
import { debugError, randomInt } from "./common/utils"

// TODO: add doc
export interface DBActions {
    createHub: () => Promise<Hub>
    deactivateHub: (id: string) => Promise<Hub>
    addData: (hubId: string, data: any) => Promise<DataItem>
    deactivateData: (id: string) => Promise<DataItem>
    getData: (hubId: string) => Promise<DataItem>
}

// TODO: add doc
function emptyHub(): Hub {
    return {
        id: "",
        created: 0,
        active: 0
    }
}

// TODO: add doc
function emptyData(): DataItem {
    return {
        id: "",
        added: 0,
        active: 0,
        content: "",
        count: 0,
        hub_id: ""
    }
}

// TODO: add doc
function createHub(db: Database): () => Promise<Hub> {
    return (): Promise<Hub> => {
        return new Promise((resolve: Resolve<Hub>): void => {
            const hub: Hub = {
                id: uuid(),
                created: Date.now(),
                active: 1
            }

            db.run(
                `INSERT INTO hubs values($id, $created, $active)`,
                {
                    $id: hub.id,
                    $created: hub.created,
                    $active: hub.active
                },
                (err: Error | null): void => {
                    if (err) {
                        throw debugError("Could not create hub", err.message)
                    }

                    resolve(hub)
                }
            )
        })
    }
}

// TODO: add doc
function deactivateHub(db: Database): (id: string) => Promise<Hub> {
    return (id: string): Promise<Hub> => {
        return new Promise((resolve: Resolve<Hub>): void => {
            function update(hub: Hub): void {
                db.run(
                    "UPDATE hubs SET active = 0 WHERE id = $id",
                    { $id: id },
                    (err: Error | null): void => {
                        if (err) {
                            throw debugError(
                                "Could not deactivate hub",
                                err.message
                            )
                        }

                        resolve({ ...hub, active: 0 })
                    }
                )
            }

            db.all(
                "SELECT * FROM hubs WHERE id = $id LIMIT 1",
                { $id: id },
                (err: Error | null, rows: Hub[]): void => {
                    if (err) {
                        throw debugError(
                            "Could not deactivate hub",
                            err.message
                        )
                    } else if (rows.length === 0) {
                        resolve(emptyHub())
                    } else if (rows[0].active === 0) {
                        resolve(rows[0])
                    } else {
                        update(rows[0])
                    }
                }
            )
        })
    }
}

// TODO: add doc
// TODO: ensure content is unique
function addData(
    db: Database
): (hubId: string, data: any) => Promise<DataItem> {
    return (hubId: string, data: any): Promise<DataItem> => {
        return new Promise((resolve: Resolve<DataItem>): void => {
            const item: DataItem = {
                id: uuid(),
                added: Date.now(),
                active: 1,
                content: data,
                count: 0,
                hub_id: hubId
            }

            db.run(
                [
                    "INSERT INTO datas VALUES",
                    "($id, $hubId, $added, $active, $count, $content)"
                ].join(" "),
                {
                    $id: item.id,
                    $hubId: item.hub_id,
                    $added: item.added,
                    $active: item.active,
                    $count: item.count,
                    $content: item.content
                },
                (err: Error | null): void => {
                    if (err) {
                        throw debugError("Could not add data", err.message)
                    }

                    resolve(item)
                }
            )
        })
    }
}

// TODO: add doc
function deactivateData(db: Database): (id: string) => Promise<DataItem> {
    return (id: string): Promise<DataItem> => {
        return new Promise((resolve: Resolve<DataItem>): void => {
            function update(data: DataItem): void {
                db.run(
                    "UPDATE datas SET active = 0 WHERE id = $id",
                    { $id: id },
                    (err: Error | null): void => {
                        if (err) {
                            throw debugError(
                                "Could not deactivate data item",
                                err.message
                            )
                        }

                        resolve({ ...data, active: 0 })
                    }
                )
            }

            db.all(
                "SELECT * FROM datas WHERE id = $id LIMIT 1",
                { $id: id },
                (err: Error | null, rows: DataItem[]): void => {
                    if (err) {
                        throw debugError(
                            "Could not deactivate data",
                            err.message
                        )
                    } else if (rows.length === 0) {
                        resolve(emptyData())
                    } else if (rows[0].active === 0) {
                        resolve(rows[0])
                    } else {
                        update(rows[0])
                    }
                }
            )
        })
    }
}

// TODO: get data
function getData(db: Database): (hubId: string) => Promise<DataItem> {
    return (hubId: string): Promise<DataItem> => {
        return new Promise((resolve: Resolve<DataItem>): void => {
            function update(data: DataItem): void {
                db.run(
                    "UPDATE datas SET count = $count WHERE id = $id",
                    { $id: data.id, $count: data.count + 1 },
                    (err: Error | null): void => {
                        if (err) {
                            throw debugError(
                                "Could not get data item",
                                err.message
                            )
                        }

                        resolve({ ...data, count: data.count + 1 })
                    }
                )
            }

            db.all(
                [
                    "SELECT * FROM datas ",
                    "WHERE hub_id = $hubId AND active = 1 ",
                    "ORDER BY count ASC"
                ].join(""),
                { $hubId: hubId },
                (err: Error | null, rows: DataItem[]): void => {
                    if (err) {
                        throw debugError("Could not deactive data", err.message)
                    } else if (rows.length === 0) {
                        resolve(emptyData())
                    } else {
                        update(rows[randomInt(0, ~~(rows.length * 0.5))])
                    }
                }
            )
        })
    }
}

// TODO: add doc
export function initDb(db: Database): Database {
    db.run(
        [
            "CREATE TABLE IF NOT EXISTS hubs(",
            "id TEXT, created INTEGER, active INTEGER)"
        ].join(""),
        (err: Error | null): void => {
            if (err) {
                throw debugError("Could not initialise DB", err.message)
            }
        }
    )

    db.run(
        [
            "CREATE TABLE IF NOT EXISTS datas(",
            "id TEXT, hub_id TEXT, added INTEGER, active INTEGER, ",
            "count INTEGER, content BLOB)"
        ].join(""),
        (err: Error | null): void => {
            if (err) {
                throw debugError("Could not initialise DB", err.message)
            }
        }
    )

    return db
}

// TODO: add doc
export function getDBActions(db: Database): DBActions {
    return {
        createHub: createHub(db),
        deactivateHub: deactivateHub(db),
        addData: addData(db),
        deactivateData: deactivateData(db),
        getData: getData(db)
    }
}
