import { Inngest } from "inngest";

import mongoose from "mongoose";
import User from "../model/user.js";
import Booking from "../model/Booking.js";
import Show from "../model/Show.js";

import sendEmail from "../configs/nodeMailer.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "movie-ticket-booking" });

// Helper to normalize incoming clerk event payloads
const extractUserFromEvent = (event) => {
  const payload = event?.data?.user || event?.data || {};
  const id = payload.id || payload.user_id;
  const first_name = payload.first_name || payload.firstName || "";
  const last_name = payload.last_name || payload.lastName || "";
  let email;
  if (
    Array.isArray(payload.email_addresses) &&
    payload.email_addresses.length
  ) {
    email =
      payload.email_addresses[0].email_address ||
      payload.email_addresses[0].email;
  }
  if (!email && (payload.email || payload.email_address))
    email = payload.email || payload.email_address;
  const image = payload.image_url || payload.image || payload.profile_image_url;

  return {
    id,
    first_name,
    last_name,
    email,
    image,
  };
};

// save user (on creation)
const syncUserCreation = inngest.createFunction(
  { id: "sync-user-clerk" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    try {
      // Ensure mongoose is connected before attempting DB operations
      if (mongoose.connection.readyState !== 1) {
        // wait up to 10s for connection
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("mongoose not connected within timeout"));
          }, 10000);
          mongoose.connection.once("connected", () => {
            clearTimeout(timeout);
            resolve();
          });
        }).catch((e) => {
          console.error(
            "syncUserCreation skipped: DB not connected:",
            e.message
          );
          return; // skip operation
        });
      }
      const { id, first_name, last_name, email, image } =
        extractUserFromEvent(event);
      if (!id) {
        console.log("syncUserCreation: missing id, skipping");
        return;
      }
      const userData = {
        _id: id,
        email,
        name: `${first_name} ${last_name}`.trim(),
        image,
      };
      await User.create(userData);
      console.log(`User created in DB: ${id}`);
    } catch (err) {
      console.error("syncUserCreation error:", err.message || err);
    }
  }
);

// delete user (on deletion)
const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-with-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    try {
      if (mongoose.connection.readyState !== 1) {
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("mongoose not connected within timeout"));
          }, 10000);
          mongoose.connection.once("connected", () => {
            clearTimeout(timeout);
            resolve();
          });
        }).catch((e) => {
          console.error(
            "syncUserDeletion skipped: DB not connected:",
            e.message
          );
          return; // skip
        });
      }
      const { id } = extractUserFromEvent(event);
      if (!id) {
        console.log("syncUserDeletion: missing id, skipping");
        return;
      }
      await User.findByIdAndDelete(id);
      console.log(`User deleted from DB: ${id}`);
    } catch (err) {
      console.error("syncUserDeletion error:", err.message || err);
    }
  }
);

// update user (on update)
const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    try {
      if (mongoose.connection.readyState !== 1) {
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("mongoose not connected within timeout"));
          }, 10000);
          mongoose.connection.once("connected", () => {
            clearTimeout(timeout);
            resolve();
          });
        }).catch((e) => {
          console.error(
            "syncUserUpdation skipped: DB not connected:",
            e.message
          );
          return; // skip
        });
      }
      const { id, first_name, last_name, email, image } =
        extractUserFromEvent(event);
      if (!id) {
        console.log("syncUserUpdation: missing id, skipping");
        return;
      }
      const userData = {
        email,
        name: `${first_name} ${last_name}`.trim(),
        image,
      };
      await User.findByIdAndUpdate(id, { $set: userData }, { upsert: true });
      console.log(`User updated in DB: ${id}`);
    } catch (err) {
      console.error("syncUserUpdation error:", err.message || err);
    }
  }
);

const releaseSeatsAndDeleteBooking = inngest.createFunction(
  { id: "release-seats-delete-booking" },
  { event: "app/checkpayment" },
  async ({ event, step }) => {
    const tenMinutesLater = new Date(Date.now() + 10 * 60 * 1000);
    await step.sleepUntil("wait-for-10-minutes", tenMinutesLater);

    await step.run("check-payment-status", async () => {
      const bookingId = event.data.bookingId;
      const booking = await Booking.findById(bookingId);

      if (!booking.isPaid) {
        const show = await Show.findById(booking.show);
        booking.bookedSeats.forEach((seat) => {
          delete show.occupiedSeats[seat];
        });
        show.markModified("occupiedSeats");
        await show.save();
        await Booking, findByIdAndDelete(booking._id);
      }
    });
  }
);

const sendBookingConfirmationEmail = inngest.createFunction(
  { id: "send-booking-confirmation-email" },
  { event: "app/show.booked" },
  async ({ event, step }) => {
    try {
      const { bookingId } = event.data;

      const booking = await Booking.findById(bookingId)
        .populate({
          path: "show",
          populate: { path: "movie", model: "Movie" },
        })
        .populate("user");

      if (!booking || !booking.user || !booking.show) {
        console.error("Invalid booking data for email confirmation", bookingId);
        return;
      }

      await sendEmail({
        to: booking.user.email,
        subject: `Payment Confirmation: "${booking.show.movie.title}" booked!`,
        body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Payment Confirmation</title>
</head>
<body style="margin:0; padding:0; font-family: Arial, Helvetica, sans-serif; background-color:#f4f6f8;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:#0f172a; color:#ffffff; padding:20px; text-align:center;">
              <h1 style="margin:0; font-size:22px;">🎬 Payment Confirmed</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:25px; color:#333333;">
              <p style="font-size:15px; margin-top:0;">
                Hi <strong>${booking.user.name}</strong>,
              </p>

              <p style="font-size:15px;">
                Thank you for your payment! Your movie ticket has been successfully booked.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0; background:#f8fafc; border-radius:6px;">
                <tr>
                  <td style="padding:12px;"><strong>🎥 Movie</strong></td>
                  <td style="padding:12px;">${booking.show.movie.title}</td>
                </tr>
                <tr>
                  <td style="padding:12px;"><strong>📅 Show Time</strong></td>
                  <td style="padding:12px;">${booking.show.showDateTime}</td>
                </tr>
                <tr>
                  <td style="padding:12px;"><strong>💺 Seats</strong></td>
                  <td style="padding:12px;">${booking.bookedSeats.join(
                    ", "
                  )}</td>
                </tr>
                <tr>
                  <td style="padding:12px;"><strong>💰 Amount Paid</strong></td>
                  <td style="padding:12px;">Rs. ${booking.amount}</td>
                </tr>
              </table>

              <p style="font-size:14px;">
                Please keep this email as your payment confirmation.
              </p>

              <p style="font-size:14px;">
                Enjoy the show 🍿
              </p>

              <p style="font-size:14px; margin-bottom:0;">
                Regards,<br/>
                <strong>Cinema Booking Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f1f5f9; text-align:center; padding:15px; font-size:12px; color:#64748b;">
              © 2026 Cinema Booking System. All rights reserved.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`,
      });
    } catch (err) {
      console.error("sendBookingConfirmationEmail error:", err.message || err);
    }
  }
);

const sendShowReminders = inngest.createFunction(
  { id: "send-show-reminders" },
  { cron: "0 */8 * * *" },
  async ({ step }) => {
    const now = new Date();
    const in8Hours = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const windowStart = new Date(in8Hours.getTime() - 10 * 60 * 1000);

    const reminderTasks = await step.run("prepare-reminder-tasks", async () => {
      const shows = await Show.find({
        showTime: { $gte: windowStart, $lte: in8Hours },
      }).populate("movie");

      const tasks = [];

      for (const show of shows) {
        if (!show.movie || !show.occupiedSeats) continue;

        const userIds = [...new set(Object.values())];
      }
    });
  }
);

// Export the Inngest functions
export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdation,
  releaseSeatsAndDeleteBooking,
  sendBookingConfirmationEmail,
];
