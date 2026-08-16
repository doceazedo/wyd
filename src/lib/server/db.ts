import { createDatabase } from "db0";
import sqlite from "db0/connectors/node-sqlite";
import { createStorage } from "unstorage";
import db0Driver from "unstorage/drivers/db0";

export const storage = createStorage({
	driver: db0Driver({
		database: createDatabase(sqlite({ name: "db" })),
		tableName: "data",
	}),
});
