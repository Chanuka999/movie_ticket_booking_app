import mongoose from "mongoose";

const connectDb = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set in environment");
  }

  // Configure mongoose behavior
  mongoose.set("strictQuery", false);
  // Increase buffer timeout so transient network hiccups don't immediately fail
  mongoose.set("bufferTimeoutMS", 10000);

  try {
    mongoose.connection.on("connected", () =>
      console.log("database connected")
    );
    mongoose.connection.on("error", (err) =>
      console.error("mongoose connection error:", err)
    );
    mongoose.connection.on("disconnected", () =>
      console.warn("mongoose disconnected")
    );

    // Accept either a full connection string or a host:port base. If the provided URI
    // doesn't include a path, append `/movie` as the database name.
    let connectUri = uri;
    try {
      const url = new URL(uri);
      if (!url.pathname || url.pathname === "/") {
        // append database name
        connectUri = uri.replace(/\/?$/, "/movie");
      }
    } catch (e) {
      // Not a full URL (e.g. mongodb://localhost:27017) — append db name
      connectUri = uri.replace(/\/?$/, "/movie");
    }

    await mongoose.connect(connectUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      retryWrites: true,
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error.message || error);
    // Help the developer with a common Atlas networking issue
    if (error.message && error.message.includes("whitelist")) {
      console.error(
        "It looks like an Atlas IP access restriction — add your IP to the cluster's Network Access list or allow 0.0.0.0/0 for testing: https://www.mongodb.com/docs/atlas/security-whitelist/"
      );
    }
    throw error;
  }
};

export default connectDb;
