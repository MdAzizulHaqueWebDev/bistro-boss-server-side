/** @format */
const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const port = process.env.PORT || 999;
const jwt = require("jsonwebtoken");

//middlewares
app.use(
	cors({
		origin: [
			"http://localhost:5173",
			"https://bistro-boss-authenticati-9f269.web.app",
		],
		credentials: true,
	}),
); // for cors policy
app.use(express.json()); // for read body data from client side

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zyi5zeh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	},
});
const menuCollection = client.db("bistroBossDB").collection("menu");
const userCollection = client.db("bistroBossDB").collection("users");
const reviewsCollection = client.db("bistroBossDB").collection("reviews");
const cartsCollection = client.db("bistroBossDB").collection("carts");

// token verifier middlewares
const verifyToken = (req, res, next) => {
	const headers = req.headers.authorization;
	if (!headers) return res.status(403).send({ message: "forbidden acess" });
	const token = headers.split(" ")[1];
	// verify by jwt
	jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
		if (err) return res.status(403).send({ err });
		req.user = decoded;
		next();
	});
};
// verify admin
const verifyAdmin = async (req, res, next) => {
	const currentUserEmail = req.user.email;
	const query = { email: currentUserEmail };
	const result = await userCollection.findOne(query);
	const isAdmin = result.role === "admin";
	if (!isAdmin) return res.status(403).send({ message: "forbidden access" });
	next();
};

async function run() {
	try {
		app.get("/menu", async (req, res) => {
			const result = await menuCollection.find().toArray();
			res.send(result);
		});
		app.get("/reviews", async (req, res) => {
			const result = await reviewsCollection.find().toArray();
			res.send(result);
		});

		// users related api

		// get all users
		app.get("/users", verifyToken, verifyAdmin, async (req, res) => {
			const loggedEmail = req.user.email;
			console.log(loggedEmail);
			// if(!)
			const result = await userCollection.find().toArray();
			res.send(result);
		});
		// get admin
		app.get("/users/admin/:email", verifyToken, async (req, res) => {
			const currentUserEmail = req.params.email;
			if (currentUserEmail !== req.user.email)
				return res.status(403).send({ message: "unauthorized acsess" });
			const query = { email: currentUserEmail };
			const result = await userCollection.findOne(query);
			let admin = false;
			if (result.email === currentUserEmail) {
				admin = result.role === "admin";
			}
			res.send({ admin });
		});

		// post single user
		app.post("/users", async (req, res) => {
			const userInfo = req.body;
			const query = { email: userInfo.email };
			const findExistingUser = await userCollection.findOne(query);
			if (findExistingUser) {
				return res.send({ message: "user already exits", insertedId: null });
			}
			const result = await userCollection.insertOne(userInfo);
			res.send(result);
		});
		// delete single user
		app.delete("/users/:email", async (req, res) => {
			const deleteEmail = req.params.email;
			console.log(deleteEmail);
			const query = {
				email: deleteEmail,
			};
			const result = await userCollection.deleteOne(query);
			res.send(result);
		});
		// make admin an user
		app.patch(
			"/users/admin/:id",
			verifyToken,
			verifyAdmin,
			async (req, res) => {
				const userId = req.params.id;
				const filter = { _id: new ObjectId(userId) };
				const updatedDoc = {
					$set: {
						role: "admin",
					},
				};
				const result = await userCollection.updateOne(filter, updatedDoc);
				res.send(result);
			},
		);

		// post carts data
		app.post("/carts", async (req, res) => {
			const cartItem = req.body;
			const result = await cartsCollection.insertOne(cartItem);
			res.send(result);
		});
		//get carts
		app.get("/carts", async (req, res) => {
			const email = req.query?.email;
			const query = { userEmail: email };
			const result = await cartsCollection.find(query).toArray();
			res.send(result);
		});
		// delete single carts item
		app.delete("/carts/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: new ObjectId(id) };
			const result = await cartsCollection.deleteOne(query);
			res.send(result);
		});

		// jwt related api
		app.post("/jwt", (req, res) => {
			const userEmail = req.body;
			console.log(userEmail);
			const token = jwt.sign(userEmail, process.env.ACCESS_TOKEN_SECRET, {
				expiresIn: "1h",
			});
			res.send({ token });
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
