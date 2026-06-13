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

// Get all doctors with optional search query (by name or specialty)
app.get('/doctors', async (req, res) => {
  try {
    const search = req.query.search || "";
    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { specialty: { $regex: search, $options: "i" } }
        ]
      };
    }
    const cursor = doctorsCollection.find(query);
    const result = await cursor.toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Get a single doctor details by custom ID (Handles both String and Number types)
app.get('/doctors/:id', async (req, res) => {
  try {
    const idParam = req.params.id;
    
    // Create an OR query to match id as either a String or a Number
    const query = {
      $or: [
        { id: idParam },
        { id: parseInt(idParam) || -1 } 
      ]
    };

    const result = await doctorsCollection.findOne(query);
    
    if (!result) {
      return res.status(404).send({ message: "Doctor not found" });
    }
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Appointment Booking API 
app.post('/api/appointments', async (req, res) => {
  try {
    const booking = req.body;
    const result = await appointmentsCollection.insertOne(booking);
    res.send({ success: true, result, message: "Appointment booked successfully!" });
  } catch (error) {
    res.status(500).send({ success: false, error: error.message });
  }
});

// Get User Specific Bookings 
app.get('/api/appointments', async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) {
      return res.status(400).send({ error: "Email query parameter is required" });
    }
    const query = { userEmail: email };
    const result = await appointmentsCollection.find(query).toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Update Appointment API with Safe ObjectId Validation
app.put('/api/appointments/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    // Validate if the incoming ID is a valid MongoDB ObjectId format
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ success: false, message: "Invalid appointment ID format" });
    }

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

// Delete Appointment API with Safe ObjectId Validation
app.delete('/api/appointments/:id', async (req, res) => {
  try {
    const id = req.params.id;

    // Validate if the incoming ID is a valid MongoDB ObjectId format
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ success: false, message: "Invalid appointment ID format" });
    }

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