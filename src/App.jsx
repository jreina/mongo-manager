import { useEffect, useState } from "react";
import "./App.css";
import axios from "axios";
import {
  FaDatabase,
  FaCaretRight,
  FaCaretDown,
  FaTable,
  FaPlay,
} from "react-icons/fa";
import { c } from "./utilities/c";

function DatabaseListItem(props) {
  const [collections, setCollections] = useState([]);

  async function handleDoubleClick() {
    const collections = await axios
      .get(`/api/databases/${props.database}/collections`)
      .then((x) => x.data);
    setCollections(collections);
    if (props.dispatchDatabase) props.dispatchDatabase(props.database);
  }

  async function handleCollectionDoubleClick(collection) {
    if (props.dispatchCollection)
      props.dispatchCollection(props.database, collection);
  }
  return (
    <li
      className="list-group-item user-select-none"
      onDoubleClick={handleDoubleClick}
    >
      {collections.length ? <FaCaretDown /> : <FaCaretRight />} <FaDatabase />{" "}
      {props.database}
      <ul className="list-group mt-2">
        {collections.map((collection) => (
          <li
            className="list-group-item"
            onDoubleClick={(_) => handleCollectionDoubleClick(collection)}
          >
            <FaTable /> {collection}
          </li>
        ))}
      </ul>
    </li>
  );
}

function QueryWindow(props) {
  const [query, setQuery] = useState(
    `db.collection("${props.collection}").find({  })`
  );
  const [results, setResults] = useState("");

  function execute() {
    axios
      .post(`/api/databases/${props.database}/executeQuery`, { query })
      .then((x) => setResults(JSON.stringify(x.data, null, 2)));
  }
  return (
    <div className={c({ "container-fluid h-100": true, "d-none": !props.show })}>
      <div className="row">
        <div className="col-12">
          <FaDatabase /> {props.database}
        </div>
      </div>
      <div className="row">
        <div className="col-12">
          {/* Query panel */}
          <h5>Query</h5>
          <textarea
            className="form-control"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          ></textarea>
          <button className="btn btn-success mt-2" onClick={execute}>
            <FaPlay /> Execute
          </button>
        </div>
      </div>
      <div className="row mt-3 h-100">
        <div className="col-12 h-100 overflow-scroll">
          {/* Results panel */}
          <h5>Results</h5>
            <code>
          <pre>{results}
          </pre></code>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionString, setConnectionString] = useState("mongodb://");
  const [databases, setDatabases] = useState([]);
  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(0);

  async function connect() {
    await axios.post("/api/databases/connect", { connectionString });
    setIsConnected(true);
    const dbs = await axios
      .get("/api/databases", { connectionString })
      .then((x) => x.data);
    setDatabases(dbs);
  }

  function addTab(database, collection) {
    setActiveTab(tabs.length);
    setTabs((t) => t.concat({ database, collection }));
  }

  useEffect(() => {
    axios.get("/api/connected").then((v) => {
      const connected = v.data.isConnected;
      setIsConnected(connected);
      if (connected) {
        axios
          .get("/api/databases", { connectionString })
          .then((x) => setDatabases(x.data));
      }
    });
  }, []);
  return isConnected ? (
    <div className="container-fluid vh-100">
      <div className="row h-100">
        <div className="col-3 overflow-auto vh-100">
          {/* Database list */}
          <ul className="list-group">
            {databases.map((db) => (
              <DatabaseListItem database={db} dispatchCollection={addTab} />
            ))}
          </ul>
        </div>
        <div className="col-9 h-100">
          <div className="container-fluid h-100">
            <ul className="nav nav-tabs">
              {tabs.map((tab, index) => (
                <li className="nav-item" onClick={(_) => setActiveTab(index)}>
                  <span
                    className={c({
                      "nav-link": true,
                      active: index === activeTab,
                    })}
                  >
                    {tab.database}
                  </span>
                </li>
              ))}
            </ul>
            {tabs.map((tab, index) => (
              <QueryWindow
                database={tab.database}
                collection={tab.collection}
                show={activeTab === index}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="container">
      <div className="row">
        <div className="col">
          <div class="mb-3">
            <label for="connection-string" class="form-label h5">
              Connection String
            </label>
            <input
              type="connection-string"
              class="form-control"
              onChange={(e) => setConnectionString(e.target.value)}
              value={connectionString}
            />
            <button className="btn btn-primary mt-2" onClick={connect}>
              Connect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
