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

async function run() {
    try {
        await client.connect();
        const database = client.db(process.env.DBNAME);
        const usersCollection = database.collection("users");

        // CREATING A USER WITH -USERNAME, PASSWORD, EMAIIL
        app.post('/register', async (req, res) => {
            const { email, password, username } = req.body;
            if (!email || !password || !username) res.send({ status: 400, message: "Incomplete Request" });

            else if (email && password && username) {
                try {
                    const hashedPassword = await bcrypt.hash(password, 10);
                    const user = { email, hashedPassword, username };
                    const result = await usersCollection.insertOne(user);
                    res.json({ status: 'ok', user, result });
                } catch (err) {
                    console.log(err);
                    res.json({ status: 400, message: err || "Error in Database" });
                }
            } else res.json({ status: 400, message: "Unknown error" });
        });

        app.post('/login', async (req, res) => {
            const { password, username } = req.body;
            if (!password || !username) {
                res.send({ status: 400, message: "Incomplete Request" })
            } else if (password && username) {
                const user = await usersCollection.findOne({ username });
                if (!user) {
                    return { status: 404, error: 'No user found with this email' }
                } else if (user) {
                    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);
                    if (isPasswordValid) {
                        res.json({ status: 'ok', user })
                    } else {
                        res.json({ status: 401, message: 'Wrong Password' })
                    }
                }
            }

        })

    } finally {
        // await client.close();
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.json({ status: 400, message: "server running", uri: process.env.URI })
});

app.listen(port, () => {
    console.log(`Running server on http://localhost:${port}`);
});