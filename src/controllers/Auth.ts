import Auth from "@/models/Auth";
import AsyncHandler from "@/middlewares/AsyncHandler";
import ErrorHandler from "@/utils/errorHandler";
import { NextFunction, Request, Response } from "express";
import OtpGenerator from "otp-generator";
import Otp from "@/models/Otp";
import SendMail from "@/utils/SendMail";
import crypto from "crypto";
import { Compare, Hash } from "@/utils/Hashing";
import { Op } from "sequelize";
import { SendToken } from "@/utils/SendToken";
import { AuthenticatedRequest } from "@/middlewares/Auth";

// @desc        Send OTP request
// @route       POST  /api/auth/send-otp
// @access      Public
export const SendOtp = AsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, purpose } = req.body;

    if (!email || !purpose) {
      return next(new ErrorHandler(400, "Email and purpose are required!"));
    }

    // Check if user exists while registering
    if (purpose === "register") {
      const isExist = await Auth.findOne({ where: { email } });
      if (isExist) {
        return next(
          new ErrorHandler(400, "User already registered, please login!")
        );
      }
    }

    if (purpose === "forget") {
      const user = await Auth.findOne({ where: { email } });

      if (!user) {
        return next(new ErrorHandler(404, "User not found!"));
      }
    }

    // Delete all expired OTPs
    await Otp.destroy({
      where: { otpExpiry: { [Op.lte]: new Date() } },
    });

    // Generate a new OTP
    const otp = OtpGenerator.generate(6, {
      specialChars: false,
      digits: true,
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
    });

    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // Check if a valid OTP already exists
    const otpExist = await Otp.findOne({
      where: { email, purpose },
    });

    if (otpExist) {
      await otpExist.destroy();
    }

    await Otp.create({
      email,
      otp: hashedOtp,
      otpExpiry,
      purpose,
      attempts: 0,
      lastRequestTime: new Date(),
    });

    await SendMail(email, otp, res);
  }
);

// @desc        Register New User
// @route       POST  /api/auth/register
// @access      Public
export const RegisterUser = AsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password, role, otp, purpose } = req.body;

    // Check if user already exists
    const isExist = await Auth.findOne({ where: { email } });

    if (isExist) {
      return next(
        new ErrorHandler(400, "User already registered, please login!")
      );
    }

    // Find the OTP entry
    const otpExist = await Otp.findOne({ where: { email, purpose } });

    if (!otpExist) {
      return next(new ErrorHandler(400, "Invalid OTP or expired!"));
    }

    // Check if OTP has expired
    if (new Date() > otpExist.otpExpiry) {
      await otpExist.destroy();
      return next(
        new ErrorHandler(400, "OTP expired. Please request a new one!")
      );
    }

    // Hash the received OTP for comparison
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    // Compare stored OTP with the hashed received OTP
    if (hashedOtp !== otpExist.otp) {
      return next(new ErrorHandler(400, "Invalid OTP!"));
    }

    if (password.length < 6) {
      return next(
        new ErrorHandler(400, "Password must be at least 6 characters long!")
      );
    }

    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;

    if (!regex.test(password)) {
      return next(
        new ErrorHandler(
          400,
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character!"
        )
      );
    }

    // Hash the password before saving
    const hashedPassword = await Hash(password);

    // Create new user
    const createdUser = await Auth.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    const user = await Auth.findByPk(createdUser.dataValues.id);

    // Delete OTP after successful registration
    await otpExist.destroy();

    SendToken(res, user?.dataValues.id);
    res.status(201).json({
      success: true,
      message: "User registered successfully!",
      data: user?.dataValues,
    });
  }
);

// @desc        Login User
// @route       POST  /api/auth/login
// @access      Public
export const LoginUser = AsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    const isExist = await Auth.scope("withPassword").findOne({
      where: { email },
    });

    const hashedPassword = isExist?.dataValues.password || "";

    const comparePassword = await Compare(password, hashedPassword);

    if (!isExist || !comparePassword) {
      return next(new ErrorHandler(401, "Invalid credentials!"));
    }

    const user = await Auth.findByPk(isExist.dataValues.id);

    SendToken(res, user?.dataValues.id);

    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      data: user?.dataValues,
    });
  }
);

// @desc        User Profile
// @route       GET  /api/auth/profile
// @access      Private
export const UserProfile = AsyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    res.status(200).json({
      success: true,
      data: req.user?.dataValues,
    });
  }
);

// @desc        Logout User
// @route       GET  /api/auth/logout
// @access      Private
export const LogoutUser = AsyncHandler(async (req: Request, res: Response) => {
  res.clearCookie("token");

  res.status(200).json({
    success: true,
    message: "User logged out successfully",
  });
});

// @desc        Update User Profile
// @route       PUT  /api/auth/profile/update
// @access      Private
export const UpdateUserProfile = AsyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { name } = req.body;

    const id = req.user?.id;

    await Auth.update({ name }, { where: { id } });

    const user = await Auth.findByPk(id);

    res.status(200).json({
      success: true,
      message: "User profile updated successfully",
      data: user?.dataValues,
    });
  }
);

// @desc        Update User Password
// @route       PUT  /api/auth/password/update
// @access      Private
export const UpdateUserPassword = AsyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { OldPassword, NewPassword } = req.body;

    const id = req.user?.id;

    const isExist = await Auth.scope("withPassword").findOne({
      where: { id },
    });

    const comparePassword = await Compare(
      OldPassword,
      isExist?.dataValues.password || ""
    );

    if (!comparePassword) {
      return next(
        new ErrorHandler(401, "Old password is invalid please try again!")
      );
    }

    if (NewPassword.length < 6) {
      return next(
        new ErrorHandler(400, "Password must be at least 6 characters long!")
      );
    }

    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;

    if (!regex.test(NewPassword)) {
      return next(
        new ErrorHandler(
          400,
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character!"
        )
      );
    }

    // Hash the password before saving
    const hashedPassword = await Hash(NewPassword);

    await Auth.update({ password: hashedPassword }, { where: { id } });

    res.status(200).json({
      success: true,
      message: "User password updated successfully",
    });
  }
);

// @desc        Reset User Password
// @route       PUT  /api/auth/password/reset
// @access      Private
export const ResetUserPassword = AsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password, otp, purpose } = req.body;

    // Hash the received OTP for comparison
    const hashedOtp = crypto
      .createHash("sha256")
      .update(String(otp))
      .digest("hex");

    // Find the OTP entry
    const otpExist = await Otp.findOne({
      where: {
        email,
        otp: hashedOtp,
        purpose,
        otpExpiry: { [Op.gt]: new Date() },
      },
    });

    if (!otpExist) {
      return next(
        new ErrorHandler(
          400,
          "OTP is invalid or is expired. Please request for new one!"
        )
      );
    }

    if (password.length < 6) {
      return next(
        new ErrorHandler(400, "Password must be at least 6 characters long!")
      );
    }

    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;

    if (!regex.test(password)) {
      return next(
        new ErrorHandler(
          400,
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character!"
        )
      );
    }

    // Hash the password before saving
    const hashedPassword = await Hash(password);

    await Auth.update({ password: hashedPassword }, { where: { email } });

    // Delete OTP after successful password reset
    await otpExist.destroy();

    res.status(200).json({
      success: true,
      message: "User password reset successfully",
    });
  }
);

// @desc        Delete User Account
// @route       DELETE  /api/auth/profile/delete
// @access      Private
export const DeleteUserProfile = AsyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const id = req.user?.id;

    await Auth.destroy({ where: { id } });

    res.status(200).json({
      success: true,
      message: "User account deleted successfully",
    });
  }
);
