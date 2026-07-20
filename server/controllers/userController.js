import { User } from "../models/User.js";
import { isCloudinaryConfigured } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadBufferToCloudinary } from "../utils/cloudinaryUpload.js";

const MAX_PROFILE_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const PROFILE_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"]);

export const getUsers = asyncHandler(async (req, res) => {
  const { role } = req.query;
  const filter = role ? { role } : {};
  const users = await User.find(filter);
  res.status(200).json(new ApiResponse(200, { users, count: users.length }, "OK"));
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound("User not found");
  res.status(200).json(new ApiResponse(200, { user: user.toSafeObject() }, "OK"));
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, avatar } = req.body;
  const updates = {};
  if (typeof name === "string") updates.name = name;
  if (typeof avatar === "string") updates.avatar = avatar;

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  res.status(200).json(new ApiResponse(200, { user: user.toSafeObject() }, "Profile updated"));
});

export const uploadProfileAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest("No profile photo was uploaded");
  }

  if (!PROFILE_IMAGE_TYPES.has(req.file.mimetype)) {
    throw ApiError.badRequest("Profile photo must be a PNG, JPG, WEBP, or GIF image");
  }

  if (req.file.size > MAX_PROFILE_IMAGE_SIZE_BYTES) {
    throw ApiError.badRequest("Profile photo must be 5MB or smaller");
  }

  let avatarUrl = "";

  if (isCloudinaryConfigured) {
    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: `microtask-marketplace/users/${req.user._id}/avatar`,
      transformation: [{ width: 320, height: 320, crop: "fill", gravity: "face" }],
    });
    avatarUrl = result.secure_url;
  } else {
    const base64 = req.file.buffer.toString("base64");
    avatarUrl = `data:${req.file.mimetype};base64,${base64}`;
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: avatarUrl },
    { new: true, runValidators: true }
  );

  res.status(201).json(new ApiResponse(201, { user: user.toSafeObject(), avatar: avatarUrl }, "Profile photo uploaded"));
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw ApiError.notFound("User not found");
  res.status(200).json(new ApiResponse(200, null, "User removed"));
});