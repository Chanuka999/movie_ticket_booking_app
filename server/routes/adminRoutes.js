import express from "express";
import { protectAdmin } from "../middleware/auth.js";
import {
  getAllBookings,
  getAllShows,
  getDashboardData,
  isAdmin,
} from "../controllers/adminController.js";

const adminRouter = express.Router();

adminRouter.get("/is-admin", protectAdmin, isAdmin);
adminRouter.get("/dashboard", protectAdmin, getDashboardData);
adminRouter.get("/is-admin", protectAdmin, getAllShows);
adminRouter.get("/is-admin", protectAdmin, getAllBookings);

export default adminRouter;
