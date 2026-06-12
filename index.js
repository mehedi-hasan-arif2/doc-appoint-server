const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
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

// Global variables for collections
let usersCollection;
let doctorsCollection;
let appointmentsCollection;

// Connect to MongoDB
async function run() {
  try {
    await client.connect();
    console.log("Database connected successfully");

    // Initialize database and collections
    const database = client.db("DocAppoint");
    usersCollection = database.collection("users");
    doctorsCollection = database.collection("doctors");
    appointmentsCollection = database.collection("appointments");

  } catch (error) {
    console.error("Database error:", error.message);
  }
}
run().catch(console.dir);

// JWT Middleware for Security
const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'Unauthorized access' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET || 'secret_key', (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access' });
    }
    req.decoded = decoded;
    next();
  });
};

// --- API ROUTES ---

// JWT Generator Route
app.post('/jwt', (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.JWT_SECRET || 'secret_key', { expiresIn: '1h' });
  res.send({ token });
});

// Doctors APIs 
app.get('/doctors', async (req, res) => {
  try {
    const search = req.query.search || "";
    let query = {};
    if (search) {
      query = { name: { $regex: search, $options: "i" } };
    }
    const cursor = doctorsCollection.find(query);
    const result = await cursor.toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// data route to insert doctors from data.json 
app.post('/seed-doctors', async (req, res) => {
  try {
    const doctors = req.body;
    const result = await doctorsCollection.insertMany(doctors);
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Appointment Booking API 
app.post('/appointments', async (req, res) => {
  try {
    const booking = req.body;
    const result = await appointmentsCollection.insertOne(booking);
    res.send({ success: true, result, message: "Appointment booked successfully!" });
  } catch (error) {
    res.status(500).send({ success: false, error: error.message });
  }
});

// Get User Specific Bookings 
app.get('/my-bookings', async (req, res) => {
  try {
    const email = req.query.email;
    const query = { userEmail: email };
    const result = await appointmentsCollection.find(query).toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Update Appointment API 
app.put('/appointments/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) };
    const updatedData = req.body;
    
    const updateDoc = {
      $set: {
        patientName: updatedData.patientName,
        gender: updatedData.gender,
        phone: updatedData.phone,
        appointmentDate: updatedData.appointmentDate,
        appointmentTime: updatedData.appointmentTime,
      },
    };

    const result = await appointmentsCollection.updateOne(filter, updateDoc);
    res.send({ success: true, result, message: "Appointment updated successfully!" });
  } catch (error) {
    res.status(500).send({ success: false, error: error.message });
  }
});

// Delete Appointment API 
app.delete('/appointments/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await appointmentsCollection.deleteOne(query);
    res.send({ success: true, result, message: "Appointment deleted successfully!" });
  } catch (error) {
    res.status(500).send({ success: false, error: error.message });
  }
});

// Profile Update API
app.put('/users/profile', async (req, res) => {
  try {
    const email = req.query.email;
    const filter = { email: email };
    const updatedUser = req.body;
    const updateDoc = {
      $set: {
        name: updatedUser.name,
        photo: updatedUser.photo,
      }
    };
    const result = await usersCollection.updateOne(filter, updateDoc, { upsert: true });
    res.send({ success: true, result, message: "Profile updated successfully!" });
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