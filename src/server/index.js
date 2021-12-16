const express = require("express");
const morgan = require("morgan");
const safeEval = require("safe-eval");
const { MongoClient } = require("mongodb");

const app = express();

app.use(express.json());
app.use(morgan("dev"));

/** @type MongoClient */
let client;

/**
 * !!
 * @param {string} command
 * @returns {Promise<Array<any>>}
 */
function evaluateCommand(command, database) {
  return safeEval(command, {
    db: client.db(database),
    ISODate: (d) => new Date(d),
  }).toArray();
}

app.get("/api/connected", async (req, res) => {
  return res.json({ isConnected: !!client });
});

app.get("/api/databases/:database/collections", async (req, res) => {
  if (!client) return res.status(400).json({ message: "Not connected" });
  const collections = await client
    .db(req.params.database)
    .listCollections()
    .toArray();
  return res.json(collections.map((collection) => collection.name));
});

app.get("/api/databases", async (req, res) => {
  if (!client) return res.status(400).json({ message: "Not connected" });
  const databases = await client.db().admin().listDatabases();
  return res.json(databases.databases.map((db) => db.name));
});

app.post("/api/databases/connect", async (req, res) => {
  client = await MongoClient.connect(req.body.connectionString);
  return res.json({ message: "connected" });
});

app.post("/api/databases/:database/executeQuery", async (req, res) => {
  if (!client) return res.status(400).json({ message: "Not connected" });
  const {
    params: { database },
    body: { query },
  } = req;
  try {
    const result = await evaluateCommand(query, database);
    return res.json(result);
  } catch (err) {
    return res.json("There was an error");
  }
});

app.listen(4000, () => {
  console.log("listening on http://localhost:4000");
});
