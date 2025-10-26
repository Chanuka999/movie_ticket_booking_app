import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDb from "./configs/db.js";
import { serve } from "inngest/express";
import { clerkMiddleware } from "@clerk/express";
import { inngest, functions } from "./inngest/index.js";

const app = express();
const PORT = 3000;

await connectDb();

//middleware
app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());

//api routes
app.get("/", (req, res) => res.send("server is live"));
app.use("/api/inngest", serve({ client: inngest, functions }));

app.listen(PORT, () => console.log(`server is stating on ${PORT}`));
