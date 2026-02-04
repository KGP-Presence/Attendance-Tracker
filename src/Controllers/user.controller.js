import { User } from "../Models/user.model.js";
import { asyncHandler } from "../Utils/asyncHandler.js";
import { ApiError } from "../Utils/ApiError.js";
import { ApiResponse } from "../Utils/ApiResponse.js";

import jwt from "jsonwebtoken";

const generateRefreshAndAccessToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found while generating tokens");
    }
    
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.log(userId);
    console.log(error);
    throw new ApiError(
      500,
      "Something went wrong while generating AccessToken or refreshToken"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, instituteId, rollNo, password } = req.body;

  console.log("instituteId:", instituteId);

  if (
    [instituteId, firstName, lastName, rollNo, password].some(
      (field) => field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({ instituteId });

  if (existedUser) {
    throw new ApiError(409, "user with same name or mail already exists");
  }

  const user = await User.create({
    instituteId,
    password,
    firstName: firstName.toLowerCase(),
    lastName: lastName.toLowerCase(),
    rollNo,
  });

  const userCreated = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!userCreated) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, userCreated, "user registered successfully"));
});

const login = asyncHandler(async (req, res) => {
  const { instituteId, password } = req.body;

  if (!instituteId) {
    throw new ApiError(400, "InstituteId is required");
  }

  const user = await User.findOne({
    instituteId,
  });

  if (!user) {
    throw new ApiError(404, "User is not registered or found");
  }

  const validatePassword = await user.isPasswordCorrect(password);

  if (!validatePassword) {
    throw new ApiError(401, "wrong user credentials");
  }

  const { accessToken, refreshToken } = await generateRefreshAndAccessToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!loggedInUser) {
    throw new ApiError(500, "Something went wrong while logging in the user");
  }

  const options = {
    httpOnly: true, // allows only server to modify cookies
    secure: true,
  };

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken: accessToken,
          refreshToken: refreshToken,
        },
        `${loggedInUser.role} logged in successfully`
      )
    );
});

const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true, // allows only server to modify cookies
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
      new ApiResponse(200, {}, ` ${req.user.role} logged out successfully`)
    );
});

const changePassword = asyncHandler(async (req, res) => {});

const deleteUser = asyncHandler(async (req, res) => {});

const updateProfile = asyncHandler(async (req, res) => {});

const getUserById = asyncHandler(async (req, res) => {});

const getAllUsers = asyncHandler(async (req, res) => {});

const getUser = asyncHandler(async (req, res) => {
  const user = await req.user;
  if(!user) throw new ApiError(404, "User not found");

  return res.status(200).json(new ApiResponse(200, "User fetched successfully", user));
});

export {
  registerUser,
  login,
  logout,
  changePassword,
  deleteUser,
  updateProfile,
  getUserById,
  getAllUsers,
  getUser,
};
