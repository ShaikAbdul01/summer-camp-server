const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const port = process.env.PORT || 5000;

require("dotenv").config();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5yf9dzl.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const classesCollection = client.db("artistryDb").collection("classes");
    const instructorsCollection = client
      .db("artistryDb")
      .collection("instructors");
    const classesItemCollection = client
      .db("artistryDb")
      .collection("classesItem");

    app.get("/classes", async (req, res) => {
      const result = await classesCollection.find().toArray();
      res.send(result);
    });
    app.get("/instructors", async (req, res) => {
      const result = await instructorsCollection.find().toArray();
      res.send(result);
    });

    /* app.get("/classItem", async (req, res) => {
      const email = req.query.email;
      if (!email) {
        res.send([]);
      }

        const decodedEmail = req.decoded.email;
        if (email !== decodedEmail) {
          return res
            .status(403)
            .send({ error: true, message: "forbidden access" });
        } 
      const query = { email: email };
      const result = await classesCollection.find(query).toArray();
      res.send(result);
    });
 */

    app.get("/classItem", async (req, res) => {
      const email = req.query.email;

      if (!email) {
        res.send([]);
        return;
      }

      const query = { email: email };

      try {
        const classesCollection = client.db("artistryDb").collection("classes");
        const result = await classesCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.error("Failed to fetch class items:", error);
        res
          .status(500)
          .json({ error: true, message: "Failed to fetch class items" });
      }
    });

    app.post("/classItem", async (req, res) => {
      const item = req.body;
      // console.log(item);
      const result = await classesCollection.insertOne(item);
      res.send(result);
    });
    app.delete("/classItem/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await classesCollection.deleteOne(query);
      res.send(result);
    });

    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Artistry Academy is running!");
});

app.listen(port, () => {
  console.log(`Artistry Academy listening on port ${port}`);
});
