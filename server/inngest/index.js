import { Inngest } from "inngest";
import express from "express";
import mongoose from "mongoose";
import User from "../model/user.js";
import Booking from "../model/Booking.js";
import Show from "../model/Show.js";

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

// Export the Inngest functions
export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdation,
  releaseSeatsAndDeleteBooking,
];
