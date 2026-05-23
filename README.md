# Doctor Appointment Manager (DocAppoint Server)

This is the backend server for the DocAppoint web application, handling database connections, secure API routes, and user configurations.

## Features & Functionalities
- **Secure Authentication:** Implements JWT-based authentication system to protect private layout configurations and user dashboards.
- **Dynamic Doctor Management:** Specialized REST API routes to search and filter doctors dynamically based on names.
- **Full CRUD Support:** Enables dynamic creation, modification, and direct erasure of doctor appointments on MongoDB without ui reloads.
- **Data Integrity Safeguards:** Protects core data structures by making critical fields read-only during data modifications.
- **Fast Response Architecture:** Powered by native MongoDB Driver & Node Express architectures to handle asynchronous API calls efficiently.

## Tech Stack
- Node.js
- Express.js
- MongoDB Native Driver
- JSON Web Token (JWT)