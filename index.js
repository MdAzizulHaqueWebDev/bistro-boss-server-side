/** @format */
const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const port = process.env.PORT || 999;
//middlewares
app.use(cors()); // for cors policy
app.use(express.json()); // for read body data from client side

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zyi5zeh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	},
});

async function run() {
    const menuCollection = client.db("bistroBossDB").collection("menu");
    const reviewsCollection = client.db("bistroBossDB").collection("reviews");
	try {


		app.get("/menu", async (req, res) => {
        const result = await menuCollection.find().toArray()
        res.send(result)
        });
		app.get("/reviews", async (req, res) => {
        const result = await reviewsCollection.find().toArray()
        res.send(result)
        });
	} finally {
		// Ensures
	}
}
run().catch(console.dir);

app.get("/", (req, res) => {
	res.send("Bistro boss server running");
});
app.listen(port, () => {
	console.log(`bistro boss server running port : ${port}`);
});
