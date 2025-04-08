import { NextFunction, Request, Response } from "express";
import {
  ValidationError,
  DatabaseError,
  UniqueConstraintError,
  ForeignKeyConstraintError,
} from "sequelize";
import ErrorHandler from "@/utils/errorHandler.js";
import { envMode } from "@/app.js";
import { ErrorDTO } from "@/types/types";

export const errorMiddleware = (
  err: ErrorHandler,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  err.message = err.message || "Internal Server Error";
  err.statusCode = err.statusCode || 500;

  const response: ErrorDTO = {
    success: false,
    message: err.message,
  };

  // Handle Sequelize Errors
  if (err instanceof ValidationError) {
    response.message = err.errors.map((e) => e.message);
    err.statusCode = 400;
  }

  if (err instanceof UniqueConstraintError) {
    response.message = err.errors.map((e) => e.message);
    err.statusCode = 400;
  }

  if (err instanceof ForeignKeyConstraintError) {
    response.message = "Foreign Key Constraint Violation";
    err.statusCode = 400;
  }

  if (err instanceof DatabaseError) {
    response.message = "Database Error";
    err.statusCode = 500;
  }

  // Handle JWT Errors
  if (err.name === "JsonWebTokenError") {
    response.message = "Invalid Token, Please log in again";
    err.statusCode = 401;
  }

  if (err.name === "TokenExpiredError") {
    response.message = "Token Expired, Please log in again";
    err.statusCode = 401;
  }

  // Handle CastError (Invalid ObjectId for MongoDB, if using Mongoose)
  if (err.name === "CastError") {
    response.message = "Invalid ID format";
    err.statusCode = 400;
  }

  if (envMode === "DEVELOPMENT") {
    response.stack = err.stack;
  }

  return res.status(err.statusCode).json(response);
};

export const ExceptionError = () => {
  process.on("uncaughtException", (err) => {
    console.error(`Shutting down server due to ${err.name}`);
    console.error(`Uncaught Exception: ${err.message}`);
    if (process.env.NODE_ENV !== "PRODUCTION") {
      console.error(`Error: ${err.stack}`);
    }
    process.exit(1);
  });

  process.on("unhandledRejection", (err) => {
    if (err instanceof Error) {
      console.error(`Shutting down server due to ${err.name}`);
      console.error(`Uncaught Exception: ${err.message}`);
      if (process.env.NODE_ENV !== "PRODUCTION") {
        console.error(`Error: ${err.stack}`);
      }
    } else {
      console.error("Unknown unhandled rejection error");
    }
    process.exit(1);
  });
};
