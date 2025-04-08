// Importing Necessary Modules
import express from "express";
import helmet from "helmet";
import cors from "cors";
import { errorMiddleware, ExceptionError } from "@/middlewares/error.js";
import morgan from "morgan";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

// Load environment variables first!
dotenv.config();

// Uncaught Exception Error (now after dotenv.config)
ExceptionError();

// Importing Database Connection
import sequelize from "@/config/db";
import { AuthRoutes } from "./routes/Auth";

// Define environment variables and constants
export const envMode = process.env.NODE_ENV?.trim() || "DEVELOPMENT";
const port = process.env.PORT || 3000;

// Initialize Express App
const app = express();

// Apply Security Headers
app.use(
  helmet({
    contentSecurityPolicy: envMode !== "DEVELOPMENT",
    crossOriginEmbedderPolicy: envMode !== "DEVELOPMENT",
  })
);

// Apply Middlewares and Settings
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Proper CORS Configuration
app.use(
  cors({
    origin: ["http://localhost:3000", process.env.FRONTEND_URL as string],
    credentials: true,
  })
);

// Logger
app.use(morgan("dev"));

// Cookies Parser
app.use(cookieParser());

// Default Route for Testing Purposes
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

// your routes here
app.use("/api/auth", AuthRoutes);

// Handle Unknown Routes for ALL Methods
app.all("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Page not found",
  });
});

// Error Handling Middleware
app.use(errorMiddleware);

const DbConnection = async () => {
  try {
    // Authenticate Sequelize connection
    await sequelize.authenticate();
    console.log("Database connected successfully!");

    await sequelize.sync();

    // Start Server and Log Message
    app.listen(port, () =>
      console.log(`Server is running on Port: ${port} in ${envMode} Mode.`)
    );
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to connect to database"
    );
    process.exit(1);
  }
};

DbConnection();
