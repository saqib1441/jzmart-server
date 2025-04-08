import { NextFunction, Request, Response } from "express";
import AsyncHandler from "./AsyncHandler";
import ErrorHandler from "@/utils/errorHandler";
import jwt, { JwtPayload } from "jsonwebtoken";
import Auth from "@/models/Auth";

// Extend Express Request to include user
export interface AuthenticatedRequest extends Request {
  user?: Partial<Auth>;
}

interface DecodedToken extends JwtPayload {
  id: string;
}

export const isLoggedIn = AsyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { token } = req.cookies;

    if (!token) {
      return next(
        new ErrorHandler(400, "Please login first to access this page!")
      );
    }

    try {
      const decode = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as DecodedToken;

      if (!decode.id) {
        return next(new ErrorHandler(401, "Invalid token"));
      }

      const user = await Auth.findByPk(decode.id);

      if (!user) {
        return next(new ErrorHandler(404, "User not found"));
      }

      req.user = user.dataValues;
      next();
    } catch (error) {
      return next(
        new ErrorHandler(
          401,
          error instanceof Error ? error.message : "Invalid or expired token"
        )
      );
    }
  }
);
