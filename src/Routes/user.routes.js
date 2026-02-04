import express from 'express';

// Controllers
import {
  registerUser,
  login,
  logout,
  changePassword,
  deleteUser,
  updateProfile,
  getUserById,
  getAllUsers,
  getUser,
} from "../Controllers/user.controller.js";

import { verifyJWT } from '../Middlewares/auth.middleware.js';

const userRouter = express.Router();

userRouter.use((req, res, next) => {
  console.log(`Incoming request to user route: ${req.method} ${req.url}`);
  next();
});

// Public routes
userRouter.post("/register", registerUser);
userRouter.post("/login",  login);
userRouter.post("/logout",verifyJWT, logout);

// Protected / user management routes
userRouter.get("/me", verifyJWT, getUser);
userRouter.patch("/change-password", verifyJWT, changePassword);
userRouter.patch("/:id", verifyJWT, updateProfile);
userRouter.delete("/:id", verifyJWT, deleteUser);
userRouter.get("/:id", verifyJWT, getUserById);
userRouter.get("/", verifyJWT, getAllUsers);

export default userRouter;

