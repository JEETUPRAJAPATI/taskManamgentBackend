import express from "express";
import mongoose from "mongoose";
import { setupVite, serveStatic, log } from "./vite.js";
import { registerRoutes } from "./routes.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// MongoDB connection
const connectToMongoDB = async () => {
  try {
    const mongoUri = 'mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/TaskSetu';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB TaskSetu database');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

(async () => {
  try {
    await connectToMongoDB();
    console.log('MongoDB connection successful, registering routes...');
    
    const server = await registerRoutes(app);
    console.log('Routes registered successfully, setting up Vite...');

    // Important: This setup is for production. In development, Vite will handle HMR.
    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      await setupVite(app, server);
    }
    console.log('Vite setup complete, starting server...');

    const PORT = Number(process.env.PORT) || 5000;
    server.listen(PORT, "0.0.0.0", () => {
      log(`TaskSetu Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
})();