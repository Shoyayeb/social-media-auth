const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;

const client = new MongoClient(process.env.URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

client.connect().then(async () => {
    console.log('connected');
});
const database = client.db(process.env.DBNAME);
const usersCollection = database.collection("users");

// CREATING A USER WITH -USERNAME, PASSWORD, EMAIIL
app.post('/register', async (req, res) => {
    const { email, password, username } = req.body;
    if (!email || !password || !username) res.send({ status: 400, message: "Incomplete Request" });
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = { email, hashedPassword, username };
        const result = await usersCollection.insertOne(user);
        res.json({ status: 201, message: "User created", result });
    } catch (err) {
        console.log(err);
        res.json({ status: 400, message: err || "Error in Database" });
    }
});

app.post('/login', async (req, res) => {
    const { password, username } = req.body;
    if (!password || !username) {
        res.send({ status: 400, message: "Incomplete Request" })
    }
    await usersCollection.findOne({ username: username }).then(async (result) => {
        const isPasswordValid = await bcrypt.compare(password, result.hashedPassword);
        isPasswordValid ? res.json({ status: 200, result }) : res.json({ status: 401, message: 'Wrong Password' });
    }).catch((err) => {
        console.log(err, 'error got');
        res.json({ status: 404, message: 'No user found with this username' });
    });
});

app.get('/', (req, res) => {
    res.json({ status: 400, message: "server running", uri: process.env.URI })
});

app.listen(port, () => {
    console.log(`Running server on http://localhost:${port}`);
});