import mongoose from 'mongoose'

const otpSchema = new mongoose.Schema(
  {
    instituteId: {
      type: String,
      required: true
    },
    otp: {
      type: String,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true
    },
    isVerified: {
      type: Boolean,
      default: false,
    }
  }
)

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Otp = mongoose.model("Otp", otpSchema);