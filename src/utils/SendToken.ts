import { CookieOptions, Response } from "express";
import jwt from "jsonwebtoken";

export const SendToken = (res: Response, id: number | undefined) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: "30d",
  });

  const options: CookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  res.cookie("token", token, options);
};
