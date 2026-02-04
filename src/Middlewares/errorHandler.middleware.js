import { ApiError } from "../Utils/ApiError.js"; // Adjust path as needed

const errorHandler = (err, req, res, next) => {
  let error = err;
  console.error(error);

  // 1. Check if the error is an instance of your custom ApiError
  if (!(error instanceof ApiError)) {
    // If not, create a new ApiError to standardize it
    const statusCode = error.statusCode || error.status || 500;
    const message = error.message || "Internal Server Error";

    // We pass the original error stack so we don't lose debug info
    error = new ApiError(statusCode, message, [], error.stack);
  }

  // 2. Prepare the response object
  const response = {
    success: error.success,
    message: error.message,
    errors: error.errors,
    data: error.data, // usually null for errors
    // Only show stack trace in development mode for security
    ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {}),
  };

  // 3. Send the response
  return res.status(error.statusCode).json(response);
};

export { errorHandler };
