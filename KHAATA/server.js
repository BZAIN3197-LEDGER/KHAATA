"use strict";

const express = require("express");
const analyze = require("./api/analyze");
const cities = require("./api/cities");

const app = express();
const PORT = process.env.PORT || 3000;

app.disable("x-powered-by");
app.use(express.json({ limit: "16kb" }));
app.use(express.static(__dirname, { extensions: ["html"] }));

app.post("/api/analyze", (req, res) => analyze(req, res));
app.post("/api/cities", (req, res) => cities(req, res));

app.listen(PORT, () => {
    console.log(`KHAATA is running on http://localhost:${PORT}`);
});
