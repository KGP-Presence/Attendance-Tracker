import express from 'express';

// Controllers
import {
  registerUserInit,
  verifyOtp,
  registerUser,
  login,
  logout,
  changePassword,
  deleteUser,
  updateProfile,
  getUserById,
  getAllUsers,
  getUser,
  changeForgotPasswordInit,
  changeForgotPassword,
} from "../Controllers/user.controller.js";

import { verifyJWT } from '../Middlewares/auth.middleware.js';

const userRouter = express.Router();

userRouter.use((req, res, next) => {
  console.log(`Incoming request to user route: ${req.method} ${req.url}`);
  next();
});

// Public routes
userRouter.post("/register-init", registerUserInit);
userRouter.post("/verify", verifyOtp);
userRouter.post("/register", registerUser);
userRouter.post("/login",  login);
userRouter.post("/change-forgot-password-init", changeForgotPasswordInit);
userRouter.post("/change-forgot-password", changeForgotPassword);

// Protected / user management routes
userRouter.use(verifyJWT);
userRouter.get("/me", getUser);
userRouter.post("/logout", logout);
userRouter.patch("/change-password",  changePassword);
userRouter.patch("/",  updateProfile);
userRouter.delete("/",  deleteUser);
userRouter.delete("/:id",  deleteUser);
userRouter.get("/:id",  getUserById);
userRouter.get("/",  getAllUsers);

export default userRouter;

