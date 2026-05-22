const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware setup
app.use(cors());
app.use(express.json());

// Database connection string from .env file
const uri = process.env.DB_URI;

// Create MongoClient instance
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Global variable for collection
let usersCollection;

// Connect to MongoDB
async function run() {
  try {
    await client.connect();
    console.log("Database connected successfully");

    // Initialize database and collection
    const database = client.db("DocAppoint");
    usersCollection = database.collection("users");

  } catch (error) {
    console.error("Database error:", error.message);
  }
}
run().catch(console.dir);

// Test route to check database connection status
app.get('/test-db', async (req, res) => {
  try {
    if (!usersCollection) {
      return res.status(500).send({ success: false, message: "Database not ready" });
    }
    // Count total documents in users collection
    const count = await usersCollection.countDocuments();
    res.send({ success: true, message: "MongoDB is working", totalUsers: count });
  } catch (error) {
    res.status(500).send({ success: false, error: error.message });
  }
});

// Root API route
app.get('/', (req, res) => {
  res.send('DocAppoint Server is Running');
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});