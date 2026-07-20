import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";
import routes from "./routes/index.js";
import webhookRoutes from "./routes/webhookRoutes.js";

const app = express();

// Security headers
app.use(helmet());

// CORS - allow the Vite frontend, with credentials for cookie-based auth
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);

// Request logging
app.use(morgan(env.isProd ? "combined" : "dev"));

// Stripe webhook needs the raw, unparsed body to verify its signature, so
// it must be mounted before express.json() below.
app.use("/api/wallet/webhook", webhookRoutes);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Cookies
app.use(cookieParser(env.cookieSecret));

// Gzip compression
app.use(compression());

// Rate limiting on all API routes
app.use("/api", apiLimiter);

// Routes
app.use("/api", routes);

app.get("/", (req, res) => {
  res.json({ success: true, message: "Microtask Marketplace API is running" });
});

// 404 + global error handler (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
