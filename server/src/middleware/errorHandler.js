import { ZodError } from "zod";

export function errorHandler(error, _req, res, _next) {
  // 🔥 ALWAYS log full error
  console.error("🔥 FULL ERROR:", error);

  // Zod validation error
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: "Invalid request",
      issues: error.issues
    });
  }

  const status = error.statusCode || error.status || 500;

  // 🔥 RETURN REAL ERROR MESSAGE (important)
  res.status(status).json({
    message: error.message || "Internal Server Error",

    // optional but VERY useful while debugging
    stack: error.stack
  });
}