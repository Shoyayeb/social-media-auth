const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;

app.get('/', async (req, res) => {
    res.json({ status: 400, message: "server running" })
})


app.listen(port, () => {
    console.log(`Running server on http://localhost:${port}`);
});