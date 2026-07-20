import { ApiError } from "../utils/ApiError.js";
import { verifyAccessToken } from "../utils/generateToken.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const protect = asyncHandler(async (req, res, next) => {
  const bearer = req.headers.authorization;
  const token =
    (bearer && bearer.startsWith("Bearer ") && bearer.split(" ")[1]) ||
    req.cookies?.accessToken;

  if (!token) {
    throw ApiError.unauthorized("Not authenticated - no token provided", "NO_TOKEN");
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      // Distinct code so the frontend can silently exchange the refresh
      // token for a new access token instead of forcing a re-login.
      throw ApiError.unauthorized("Access token expired", "ACCESS_TOKEN_EXPIRED");
    }
    throw ApiError.unauthorized("Invalid or expired token", "INVALID_TOKEN");
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw ApiError.unauthorized("User no longer exists", "USER_NOT_FOUND");
  }

  req.user = user;
  next();
});

export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw ApiError.forbidden("You do not have permission to perform this action");
    }
    next();
  };

// Populates req.user when a valid session is present but does not fail
// the request otherwise - useful for endpoints that behave differently
// for logged-in vs anonymous users without requiring authentication.
export const attachUserIfPresent = asyncHandler(async (req, res, next) => {
  const bearer = req.headers.authorization;
  const token =
    (bearer && bearer.startsWith("Bearer ") && bearer.split(" ")[1]) ||
    req.cookies?.accessToken;

  if (!token) return next();

  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id);
    if (user) req.user = user;
  } catch {
    // Ignore - treat as anonymous
  }

  next();
});
