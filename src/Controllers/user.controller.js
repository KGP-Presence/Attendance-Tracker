import { User } from "../Models/user.model.js";
import { Otp } from "../Models/otp.model.js"
import { asyncHandler } from "../Utils/asyncHandler.js";
import { ApiError } from "../Utils/ApiError.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { sendOtp } from "../helpers/emailService.helper.js";

import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

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

const verifyOtp = asyncHandler(async (req, res) => {
  const { instituteId, otp } = req.body;
  if (!otp) 
    throw new ApiError(400, 'otp is required');

  const savedOtp = await Otp.findOne({ instituteId });
  if (!savedOtp) 
    throw new ApiError(404, 'no valid otp found');
  
  const isOtpCorrect = await bcrypt.compare(otp, savedOtp.otp);
  if (!isOtpCorrect) 
    throw new ApiError(401, 'otp mismatch'); 

  savedOtp.isVerified = true;
  await savedOtp.save();
  res.status(200).json(new ApiResponse(200, [], 'otp verified'));
});

const registerUserInit = asyncHandler(async (req, res) => {
  const { instituteId } = req.body;
  console.log(instituteId);
  if (instituteId.trim() === "") 
    throw new ApiError(400, "Institute Id is required");
  
  const existedUser = await User.findOne({ instituteId });
  console.log(existedUser);
  if (existedUser) 
    throw new ApiError(409, "User with this institite Id exists");

  const otp = Math.floor(1000000*Math.random()).toString().padStart(6, '0');
  const hashedOtp = await bcrypt.hash(otp, 10);
  console.log(otp, hashedOtp);

  await Otp.deleteMany({ instituteId });

  const createdOtp = await Otp.create({
    instituteId,
    otp: hashedOtp,
    expiresAt: new Date(Date.now() + 10*60*1000),
  });

  await sendOtp(instituteId, otp);

  res.status(200).json(new ApiResponse(200, [], 'otp sent succesfully'));
});

const registerUser = asyncHandler(async (req, res) => {
  const { instituteId, firstName, lastName, rollNo, password, confirmPassword } = req.body;

  if (
    [instituteId, firstName, lastName, rollNo, password, confirmPassword].some(
      (field) => field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const savedOtp = await Otp.findOne({ instituteId });
  if((!savedOtp) || (!savedOtp.isVerified)) 
    throw new ApiError(400, 'User not verified / Session expired');

  if (password !== confirmPassword) 
    throw new ApiError(400, 'password and confirmation password are not equal');

  const user = await User.create({
    instituteId,
    password,
    firstName: firstName,
    lastName: lastName,
    rollNo,
  });

  const userCreated = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!userCreated) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  await Otp.findOneAndDelete({ instituteId });

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

  const validatePassword = await bcrypt.compare(password, user.password);

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
      new ApiResponse(200, {}, `${req.user.firstName} logged out successfully`)
    );
});

const changePassword = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { password, newPassword } = req.body;

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (!(await bcrypt.compare(password, user.password))) {
    throw new ApiError(401, 'Old password is Incorrect');
  }

  if (password === newPassword) {
    throw new ApiError(400, 'New password cannot be same to the old password');
  }

  user.password = newPassword;
  const updatedUser = (await user.save()).isSelected('-password -refreshToken');

  if (!updatedUser) {
    throw new ApiError(500, 'Something went wrong in updating password');
  }

  res.status(200).json(new ApiResponse(200, updatedUser, 'Password updated succesfully'));
});

const deleteUser = asyncHandler(async (req, res) => {
  const paramId = req.params.id || req.user._id;

  if (paramId != req.user._id && req.user.role !== 'admin') {
    throw new ApiError(403, "Only admin can delete other users");
  }

  const toDeleteUserId = paramId;

  const toDeleteUser = await User.findById(toDeleteUserId);
  if (!toDeleteUser) {
    throw new ApiError(404, "User not found");
  }

  await User.findByIdAndDelete(toDeleteUserId);

  res.status(200).json(new ApiResponse(200, {}, "User deleted successfully"));
});

const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const { firstName, lastName, rollNo, graduationYear, department } = req.body;

  if (!firstName) {
    throw new ApiError(400, "First name is required");
  }
  if (!lastName) {
    throw new ApiError(400, "Last name is required");
  }
  if (!rollNo) {
    throw new ApiError(400, "Roll number is required");
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      firstName: firstName,
      lastName: lastName,
      rollNo,
      graduationYear,
      department,
    },
    { new: true }
  ).select("-password -refreshToken");

  if (!updatedUser) {
    throw new ApiError(500, "Something went wrong while updating profile");
  }
  
  res.status(200).json(new ApiResponse(200, updatedUser, "Profile updated successfully"));
});

const getUserById = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin" && req.user._id.toString() !== req.params.id) {
    throw new ApiError(403, "Access denied");
  }

  const userId = req.params.id;

  const user = await User.findById(userId).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.status(200).json(new ApiResponse(200, user, "User fetched successfully"));
});

const getAllUsers = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") {
    throw new ApiError(403, "Access denied");
  }

  const users = await User.find().select("-password -refreshToken");

  if (!users) {
    throw new ApiError(500, "Something went wrong while fetching users");
  }

  res.status(200).json(new ApiResponse(200, users, "Users fetched successfully"));
});

export {
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
};
