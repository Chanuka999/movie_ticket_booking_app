import Booking from "../model/Booking.js";
import Show from "../model/Show.js";
import User from "../model/user.js";

export const isAdmin = async (req, res) => {
  res.json({ success: true, isAdmin: true });
};

export const getDashboardData = async (req, res) => {
  try {
    const bookings = await Booking.find({ isPaid: true });
    const activeShows = await Show.find({
      showDateTime: { $gte: new Date() },
    }).populate("movie");

    const totalUser = await User.countDocuments();

    const DashboardData = {
      totalBookings: bookings.length,
      totalRevenue: bookings.reduce((acc, booking) => acc + booking.amout, 0),
      activeShows,
      totalUser,
    };
    // send DashboardData with capital D to match client expectation
    res.json({ success: true, DashboardData });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

export const getAllShows = async (req, res) => {
  try {
    // Use Mongoose sort() on the query instead of Array.toSorted
    const shows = await Show.find({ showDateTime: { $gte: new Date() } })
      .sort({ showDateTime: 1 })
      .populate("movie");
    res.json({ success: true, shows });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

export const getAllBookings = async (req, res) => {
  try {
    const booking = await Booking.find({})
      .populate("user")
      .populate({
        path: "show",
        populate: { path: "movie" },
      })
      .sort({ createdAt: -1 });
    res.json({ success: true, booking });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};
