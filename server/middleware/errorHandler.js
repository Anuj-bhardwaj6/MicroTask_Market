import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

export function notFoundHandler(req, res, next) {
  next(new ApiError(404, `Route not found - ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || (error.name === "ValidationError" ? 400 : 500);
    const message = error.message || "Internal server error";
    error = new ApiError(statusCode, message, error.errors || [], err.stack);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    error = new ApiError(409, `Duplicate value for field: ${field}`);
  }

  // Mongoose cast error (bad ObjectId)
  if (err.name === "CastError") {
    error = new ApiError(400, `Invalid value for field: ${err.path}`);
  }

  // Multer upload errors (file too large, too many files, unexpected field)
  if (err.name === "MulterError") {
    error = new ApiError(400, `Upload error: ${err.message}`);
  }

  const response = {
    success: false,
    message: error.message,
    errors: error.errors || [],
    ...(error.code ? { code: error.code } : {}),
    ...(env.isProd ? {} : { stack: error.stack }),
  };

  if (!env.isProd && error.statusCode >= 500) {
    console.error(err);
  }

  res.status(error.statusCode || 500).json(response);
}
