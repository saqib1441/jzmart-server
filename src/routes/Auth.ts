import {
  LoginUser,
  RegisterUser,
  SendOtp,
  UserProfile,
  DeleteUserProfile,
  LogoutUser,
  ResetUserPassword,
  UpdateUserPassword,
  UpdateUserProfile,
} from "@/controllers/Auth";
import { isLoggedIn } from "@/middlewares/Auth";
import { otpCooldown, otpRequestLimiter } from "@/utils/RateLimit";
import { Router } from "express";

const router = Router();

// Send Otp Request
router.post("/send-otp", otpCooldown, otpRequestLimiter, SendOtp);

// Register User
router.post("/register", RegisterUser);

// Login User
router.post("/login", LoginUser);

// User Profile
router.get("/profile", isLoggedIn, UserProfile);

// Logout User
router.get("/logout", isLoggedIn, LogoutUser);

// Update User Profile
router.put("/profile", isLoggedIn, UpdateUserProfile);

// Update User Password
router.put("/password", isLoggedIn, UpdateUserPassword);

// Reset User Password
router.post("/password/reset", ResetUserPassword);

// Delete User Profile
router.delete("/profile/delete", isLoggedIn, DeleteUserProfile);

export { router as AuthRoutes };
