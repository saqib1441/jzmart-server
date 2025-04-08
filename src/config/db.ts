// Importing Necessary Modules
import dotenv from "dotenv";
import { Sequelize } from "sequelize";

// Load environment variables
dotenv.config();

// Extract environment variables safely
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("Missing DATABASE_URL environment variable!");
}

// Initialize Sequelize connection
const sequelize = new Sequelize(DATABASE_URL, {
  dialect: "mysql",
  logging: false,
  dialectOptions: {
    ssl:
      process.env.DB_SSL === "true"
        ? {
            require: true,
            rejectUnauthorized: false,
          }
        : undefined,
  },
});

export default sequelize;
