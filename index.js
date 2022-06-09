const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const { PORT, URI, DBNAME, JWTSECRET } = process.env;

const port = PORT || 5000;

const client = new MongoClient(URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

client.connect().then(async () => {
    console.log('connected');
});
const database = client.db(DBNAME);
const usersCollection = database.collection("users");
const postsCollection = database.collection("posts");

/*///////////
AUTHENTICATION AND RESET OPERATION API HERE
//////////*/

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

// LOGIN WITH USERNAME AND PASSWORD
app.post('/login', async (req, res) => {
    const { password, username } = req.body;
    if (!password || !username) {
        res.send({ status: 400, message: "Incomplete Request" })
    }
    await usersCollection.findOne({ username }).then(async (result) => {
        const isPasswordValid = await bcrypt.compare(password, result.hashedPassword);
        const tokenData = {
            username: result.username,
            email: result.email,
            _id: result._id
        }
        const token = jwt.sign(tokenData, JWTSECRET);
        isPasswordValid ? res.json({ status: 200, token }) : res.json({ status: 401, message: 'Wrong Password' });
    }).catch((err) => {
        res.json({ status: 404, message: 'No user found with this username' });
    });
});

// RESET PASSWORD OF A USER
app.post('/reset', async (req, res) => {
    const { oldPassword, newPassword, email } = req.body;
    if (!oldPassword || !newPassword || !email) {
        res.json({ status: 400, message: "Incomplete Request" })
    };
    const user = await usersCollection.findOne({ email });
    const isPasswordValid = await bcrypt.compare(oldPassword, user.hashedPassword);
    if (!isPasswordValid) {
        res.json({ status: 400, message: "Wrong Password" });
    } else if (isPasswordValid) {
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        user.hashedPassword = hashedNewPassword;
        const result = await usersCollection.updateOne({ email }, { $set: user }, { upsert: true });
        res.json({ status: 200, message: 'password changed' });
    };
});

/*///////////
SOCIAL MEDIA POSTS CRUD OPERATION API HERE
//////////*/

app.post('/submitpost', async (req, res) => {
    const { postText } = req.body;
    if (!postText || !req.headers.authorization) {
        console.log(req.headers.authorization);
        res.json({ status: 400, message: "Incomplete Request", body: req.body, header: req.header })
    }
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7, authHeader.length);
        try {
            const decoded = jwt.verify(token, JWTSECRET);
            const { username, email, _id } = decoded;
            if (!username || !email || !_id) {
                res.json({ status: 400, message: "Incomplete Request" })
            };
            await usersCollection.findOne({ email }).then(async (result) => {
                const submitPost = await postsCollection.insertOne({ postText, username: result.username, email: result.email });
                res.json({ status: 200, message: submitPost });
            }).catch((err) => {
                res.json({ status: 404, message: "Token invalid" });
            });
        } catch (err) {
            res.json({ status: 400, message: err || "Token invalid" });
        }
    } else {
        res.json({ status: 400, message: "Token Not Found" });
    }
});

app.get('/', (req, res) => {
    res.json({ status: 400, message: "server running", uri: URI })
});

app.listen(port, () => {
    console.log(`Running server on http://localhost:${port}`);
});