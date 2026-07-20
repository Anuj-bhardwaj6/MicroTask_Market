export class ApiError extends Error {
  constructor(statusCode, message = "Something went wrong", errors = [], stack = "", code = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.success = false;
    this.data = null;
    this.code = code;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static badRequest(message = "Bad request", errors = [], code) {
    return new ApiError(400, message, errors, "", code);
  }

  static unauthorized(message = "Unauthorized", code) {
    return new ApiError(401, message, [], "", code);
  }

  static forbidden(message = "Forbidden", code) {
    return new ApiError(403, message, [], "", code);
  }

  static notFound(message = "Resource not found", code) {
    return new ApiError(404, message, [], "", code);
  }

  static conflict(message = "Conflict", code) {
    return new ApiError(409, message, [], "", code);
  }

  static internal(message = "Internal server error") {
    return new ApiError(500, message);
  }
}

export default ApiError;
