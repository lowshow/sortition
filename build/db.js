"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuidv4_1 = require("uuidv4");
const utils_1 = require("./common/utils");
// TODO: add doc
function emptyHub() {
    return {
        id: "",
        created: 0,
        active: 0
    };
}
// TODO: add doc
function emptyData() {
    return {
        id: "",
        added: 0,
        active: 0,
        content: "",
        count: 0,
        hub_id: ""
    };
}
// TODO: add doc
function createHub(db) {
    return () => {
        return new Promise((resolve) => {
            const hub = {
                id: uuidv4_1.uuid(),
                created: Date.now(),
                active: 1
            };
            db.run(`INSERT INTO hubs values($id, $created, $active)`, {
                $id: hub.id,
                $created: hub.created,
                $active: hub.active
            }, (err) => {
                if (err) {
                    throw utils_1.debugError("Could not create hub", err.message);
                }
                resolve(hub);
            });
        });
    };
}
// TODO: add doc
function deactivateHub(db) {
    return (id) => {
        return new Promise((resolve) => {
            function update(hub) {
                db.run("UPDATE hubs SET active = 0 WHERE id = $id", { $id: id }, (err) => {
                    if (err) {
                        throw utils_1.debugError("Could not deactivate hub", err.message);
                    }
                    resolve({ ...hub, active: 0 });
                });
            }
            db.all("SELECT * FROM hubs WHERE id = $id LIMIT 1", { $id: id }, (err, rows) => {
                if (err) {
                    throw utils_1.debugError("Could not deactivate hub", err.message);
                }
                else if (rows.length === 0) {
                    resolve(emptyHub());
                }
                else if (rows[0].active === 0) {
                    resolve(rows[0]);
                }
                else {
                    update(rows[0]);
                }
            });
        });
    };
}
// TODO: add doc
// TODO: ensure content is unique
function addData(db) {
    return (hubId, data) => {
        return new Promise((resolve) => {
            const item = {
                id: uuidv4_1.uuid(),
                added: Date.now(),
                active: 1,
                content: data,
                count: 0,
                hub_id: hubId
            };
            db.run([
                "INSERT INTO datas VALUES",
                "($id, $hubId, $added, $active, $count, $content)"
            ].join(" "), {
                $id: item.id,
                $hubId: item.hub_id,
                $added: item.added,
                $active: item.active,
                $count: item.count,
                $content: item.content
            }, (err) => {
                if (err) {
                    throw utils_1.debugError("Could not add data", err.message);
                }
                resolve(item);
            });
        });
    };
}
// TODO: add doc
function deactivateData(db) {
    return (id) => {
        return new Promise((resolve) => {
            function update(data) {
                db.run("UPDATE datas SET active = 0 WHERE id = $id", { $id: id }, (err) => {
                    if (err) {
                        throw utils_1.debugError("Could not deactivate data item", err.message);
                    }
                    resolve({ ...data, active: 0 });
                });
            }
            db.all("SELECT * FROM datas WHERE id = $id LIMIT 1", { $id: id }, (err, rows) => {
                if (err) {
                    throw utils_1.debugError("Could not deactivate data", err.message);
                }
                else if (rows.length === 0) {
                    resolve(emptyData());
                }
                else if (rows[0].active === 0) {
                    resolve(rows[0]);
                }
                else {
                    update(rows[0]);
                }
            });
        });
    };
}
// TODO: get data
function getData(db) {
    return (hubId) => {
        return new Promise((resolve) => {
            function update(data) {
                db.run("UPDATE datas SET count = $count WHERE id = $id", { $id: data.id, $count: data.count + 1 }, (err) => {
                    if (err) {
                        throw utils_1.debugError("Could not get data item", err.message);
                    }
                    resolve({ ...data, count: data.count + 1 });
                });
            }
            db.all([
                "SELECT * FROM datas ",
                "WHERE hub_id = $hubId AND active = 1 ",
                "ORDER BY count ASC"
            ].join(""), { $hubId: hubId }, (err, rows) => {
                if (err) {
                    throw utils_1.debugError("Could not deactive data", err.message);
                }
                else if (rows.length === 0) {
                    resolve(emptyData());
                }
                else {
                    update(rows[utils_1.randomInt(0, ~~(rows.length * 0.5))]);
                }
            });
        });
    };
}
// TODO: add doc
function initDb(db) {
    db.run([
        "CREATE TABLE IF NOT EXISTS hubs(",
        "id TEXT, created INTEGER, active INTEGER)"
    ].join(""), (err) => {
        if (err) {
            throw utils_1.debugError("Could not initialise DB", err.message);
        }
    });
    db.run([
        "CREATE TABLE IF NOT EXISTS datas(",
        "id TEXT, hub_id TEXT, added INTEGER, active INTEGER, ",
        "count INTEGER, content BLOB)"
    ].join(""), (err) => {
        if (err) {
            throw utils_1.debugError("Could not initialise DB", err.message);
        }
    });
    return db;
}
exports.initDb = initDb;
// TODO: add doc
function getDBActions(db) {
    return {
        createHub: createHub(db),
        deactivateHub: deactivateHub(db),
        addData: addData(db),
        deactivateData: deactivateData(db),
        getData: getData(db)
    };
}
exports.getDBActions = getDBActions;
