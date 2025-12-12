import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDb from "./configs/db.js";
import { serve } from "inngest/express";
import { clerkMiddleware } from "@clerk/express";

const app = express();
const PORT = 3000;

try {
  await connectDb();

  // Now import Inngest functions after DB connection to avoid buffering/timeouts
  const inngestModule = await import("./inngest/index.js");
  const { inngest, functions } = inngestModule;

  //middleware
  app.use(express.json());
  app.use(cors());
  app.use(clerkMiddleware());

  //api routes
  app.get("/", (req, res) => res.send("server is live"));
  app.use("/api/inngest", serve({ client: inngest, functions }));

  app.listen(PORT, () => console.log(`server is stating on ${PORT}`));
} catch (err) {
  console.error("Server failed to start:", err.message || err);
  process.exit(1);
}
