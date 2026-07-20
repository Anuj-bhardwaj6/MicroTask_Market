import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: {
      type: String,
      enum: ["client", "freelancer", "admin"],
      default: "client",
    },
    avatar: { type: String, default: "" },
    provider: { type: String, default: "email" },
    isVerified: { type: Boolean, default: false },
    otp: { type: String, select: false },
    otpExpires: { type: Date, select: false },
    otpPurpose: { type: String, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    refreshTokens: {
      type: [
        {
          hash: { type: String, required: true },
          expiresAt: { type: Date, required: true },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      select: false,
      default: [],
    },

    // Tasks a freelancer has bookmarked/saved from the marketplace.
    bookmarkedTasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task", default: [] }],
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  if (typeof candidate !== "string" || typeof this.password !== "string" || !this.password) {
    return false;
  }

  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function toSafeObject() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.otp;
  delete obj.otpExpires;
  delete obj.otpPurpose;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  delete obj.refreshTokens;
  return obj;
};

// Stores a newly issued refresh token (hashed) and prunes any that have
// expired or overflow a reasonable per-user device cap.
userSchema.methods.addRefreshToken = async function addRefreshToken(hash, expiresAt) {
  const now = Date.now();
  const active = (this.refreshTokens || []).filter((rt) => rt.expiresAt.getTime() > now);
  active.push({ hash, expiresAt });
  // Keep at most the 5 most recent sessions per user.
  this.refreshTokens = active.slice(-5);
  await this.save({ validateBeforeSave: false });
};

userSchema.methods.removeRefreshToken = async function removeRefreshToken(hash) {
  this.refreshTokens = (this.refreshTokens || []).filter((rt) => rt.hash !== hash);
  await this.save({ validateBeforeSave: false });
};

export const User = mongoose.model("User", userSchema);
export default User;
