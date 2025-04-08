import AsyncHandler from "@/middlewares/AsyncHandler";
import Otp from "@/models/Otp";
import { NextFunction, Request, Response } from "express";
import { Op } from "sequelize";
import ErrorHandler from "./errorHandler";

// Middleware to prevent too many OTP requests within 1 hour
export const otpRequestLimiter = AsyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { email } = req.body;

    if (!email) {
      return next(new ErrorHandler(400, "Email is required!"));
    }

    // Define time range (last 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Count OTP requests within the last hour
    const requestCount = await Otp.count({
      where: {
        email,
        lastRequestTime: { [Op.gte]: oneHourAgo },
      },
    });

    if (requestCount >= 10) {
      return next(
        new ErrorHandler(429, "Too many OTP requests. Try again later!")
      );
    }

    next();
  }
);

// Middleware to enforce cooldown period (1 request per 60 seconds)
export const otpCooldown = AsyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { email } = req.body;

    if (!email) {
      return next(new ErrorHandler(400, "Email is required!"));
    }

    // Get the latest OTP request
    const lastOtp = await Otp.findOne({
      where: { email },
      order: [["lastRequestTime", "DESC"]],
    });

    if (lastOtp && lastOtp?.lastRequestTime) {
      const timeDiff =
        (Date.now() - new Date(lastOtp?.lastRequestTime).getTime()) / 1000;

      if (timeDiff < 60) {
        return next(
          new ErrorHandler(
            429,
            `Wait ${
              60 - Math.floor(timeDiff)
            } seconds before requesting another OTP.`
          )
        );
      }
    }

    next();
  }
);
