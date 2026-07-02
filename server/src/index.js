import "dotenv/config";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { pathToFileURL } from "node:url";
import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import managementRoutes from "./routes/managementRoutes.js";
import ssoRoutes from "./routes/ssoRoutes.js";

const app = express();
const port = Number(process.env.PORT || 5000);

morgan.token("safe-url", (req) => req.originalUrl.replace(/([?&]token=)[^&]+/i, "$1[redacted]"));

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan(":method :safe-url :status :response-time ms - :res[content-length]"));
app.use(rateLimit({ windowMs: 60_000, limit: 180 }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "employee-performance-dashboard", timestamp: new Date().toISOString() });
});

app.use(ssoRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/manage", managementRoutes);

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: "Unexpected server error." });
});

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  app.listen(port, () => {
    console.log(`Employee Performance API running on http://localhost:${port}`);
  });
}

export default app;
