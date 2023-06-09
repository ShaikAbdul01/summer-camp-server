const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY);
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
    const usersCollection = client.db("artistryDb").collection("users");
    const classesCollection = client.db("artistryDb").collection("classes");
    const instructorsCollection = client
      .db("artistryDb")
      .collection("instructors");
    const classesItemCollection = client
      .db("artistryDb")
      .collection("classesItem");

    // users
    app.get("/users", async (req, res) => {
      try {
        const result = await usersCollection.find().toArray();
        res.json(result);
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Failed to fetch users" });
      }
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists" });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };
      console.log(id, filter, updateDoc);

      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.patch("/users/instructor/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "instructor",
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.delete("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });
    app.delete("/users/instructor/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    // classes
    app.get("/classes", async (req, res) => {
      const result = await classesCollection.find().toArray();
      res.send(result);
    });
    app.get("/instructors", async (req, res) => {
      const result = await instructorsCollection.find().toArray();
      res.send(result);
    });

    // classItem
    app.get("/classItem", async (req, res) => {
      const email = req.query.email;
      if (!email) {
        res.send([]);
      }
      /* const decodedEmail = req.decoded.email;
        if (email !== decodedEmail) {
          return res
            .status(403)
            .send({ error: true, message: "forbidden access" });
        }  */
      const query = { email: email };
      const result = await classesItemCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/classItem", async (req, res) => {
      const item = req.body;
      // console.log(item);
      const result = await classesItemCollection.insertOne(item);
      res.send(result);
    });

    app.delete("/classItem/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await classesItemCollection.deleteOne(query);
      res.send(result);
    });

    // instructor add a class

    app.get("/addClass/email/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      try {
        const result = await classesCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.error("Error retrieving toy data:", error);
        res.status(500).send("An error occurred while retrieving toy data.");
      }
    });
    /*  app.post("/addClass", async (req, res) => {
      const classes = req.body;
      const result = await classesCollection.insertOne(classes);
      res.send(result);
    }); */

    app.post("/addClass", async (req, res) => {
      const newClass = req.body;
      newClass.totalEnrolledStudents = 0;
      newClass.status = "pending";

      try {
        const result = await classesCollection.insertOne(newClass);
        res.json({ insertedId: result.insertedId });
      } catch (error) {
        console.error("Failed to add class:", error);
        res.status(500).json({ error: "Failed to add class" });
      }
    });

    // Update class status
    app.patch("/classes/:classId/status", async (req, res) => {
      const { classId } = req.params;
      const { status } = req.body;

      const query = { _id: new ObjectId(classId) };
      const updateDoc = {
        $set: {
          status,
        },
      };

      try {
        const result = await classesCollection.updateOne(query, updateDoc);
        res.json({ message: "Class status updated successfully" });
      } catch (error) {
        console.error("Failed to update class status:", error);
        res.status(500).json({ error: "Failed to update class status" });
      }
    });

    // Submit feedback for a class
    app.post("/classes/:classId/feedback", async (req, res) => {
      const { classId } = req.params;
      const { feedback } = req.body;

      const query = { _id: new ObjectId(classId) };

      try {
        // Fetch the class and instructor details for sending feedback
        const classItem = await classesCollection.findOne(query);
        const instructor = await instructorsCollection.findOne({
          _id: classItem.instructorId,
        });

        // Here, you can handle the logic to send the feedback to the instructor
        console.log(`Feedback for Class ${classId}: ${feedback}`);
        console.log("Instructor Email:", instructor.email);

        res.json({ message: "Feedback submitted successfully" });
      } catch (error) {
        console.error("Failed to submit feedback:", error);
        res.status(500).json({ error: "Failed to submit feedback" });
      }
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
