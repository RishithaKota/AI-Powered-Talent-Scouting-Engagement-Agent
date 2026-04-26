import { clerkMiddleware, requireAuth } from "@clerk/express";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import candidateRoutes from "./routes/candidateRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import matchRoutes from "./routes/matchRoutes.js";
import shortlistRoutes from "./routes/shortlistRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import questionsRoutes from "./routes/questions.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config({ path: new URL("../.env", import.meta.url) });


export const app = express();

const configuredOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (configuredOrigins.includes(origin)) return true;

  return /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
}

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "ai-recruiter-api" });
});

// Clerk auth context for downstream route guards.


app.use(
  clerkMiddleware({
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY
  })
);



app.use("/api/jobs", jobRoutes);
app.use("/api/match", requireAuth({ unauthorizedRedirectUrl: null }), matchRoutes);
app.use("/api/candidates", requireAuth({ unauthorizedRedirectUrl: null }), candidateRoutes);
app.use("/api/chat", requireAuth({ unauthorizedRedirectUrl: null }), chatRoutes);
app.use("/api/shortlist", requireAuth({ unauthorizedRedirectUrl: null }), shortlistRoutes);
app.use("/api/questions", requireAuth({ unauthorizedRedirectUrl: null }), questionsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use(errorHandler);
