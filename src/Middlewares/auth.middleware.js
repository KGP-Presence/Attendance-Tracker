import { ApiError } from "../Utils/ApiError.js";
import { asyncHandler } from "../Utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../Models/user.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", ""); //getting accessToken from cookies OR header

    // console.log(token);
    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    } //checking if token is available

    //comparing accessToken from currently retrieved accessToken from cookies
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    //getting user from decoded token from cookies using _id
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }

    req.user = user;

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    } else if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Access token has expired");
    } else if (error.name === "JsonWebTokenError") {
      throw new ApiError(401, "Invalid access token");
    } else {
      throw new ApiError(500, "Authentication error");
    }
  }
});
