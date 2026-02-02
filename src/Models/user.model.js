import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    instituteId: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    rollNo: {
      type: String,
      required: true,
      trim: true,
    },
    graduationYear: {
      type: Number,
    },
    timetables: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Timetable",
      },
    ],
    department: {
      type: String,
      enum: [
        "CSE",
        "ECE",
        "ME",
        "CE",
        "EE",
        "BT",
        "MT",
        "MI",
        "CH",
        "AE",
        "PH",
        "HS",
        "MA",
        "CY",
        "NA",
        "OT",
      ],
      default: "OT",
      required: true,
    },
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
      },
    ],
    role: {
      type: String,
      enum: ["normal", "admin"],
      default: "normal",
    },
    refreshToken: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next;

  this.password = await bcrypt.hash(this.password, 10);
  next;
});

userSchema.methods.isPasswordCorrect = async function (password) {
  try {
    return (await bcrypt.compare(password, this.password));
  } catch (err) {
    console.error(" Password not verifiable ", err);
    return false;
  }
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      instituteId: this.instituteId,
      firstName: this.firstName,
      lastName: this.lastName ,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};


export const User = mongoose.model("User", userSchema);

