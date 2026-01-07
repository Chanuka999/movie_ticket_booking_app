# Movie Ticket Booking App

Full-stack movie ticketing experience built with React, Vite, Express, MongoDB, Clerk for auth, Stripe for payments, and TMDB as the movie data source. Users can browse films, pick showtimes, reserve seats, pay securely, and track bookings. Admins can publish shows, review bookings, and monitor revenue.

![image_alt](https://github.com/Chanuka999/movie_ticket_booking_app/blob/41aca7785e85337b8f0fbd7ab72f914cca65a5d9/movie_ticket_Booking.png)

## Features

- Browse now-playing movies from TMDB with poster/backdrop art
- Authenticated booking and seat selection with Stripe Checkout
- Favorites synced to Clerk user metadata
- Admin dashboard for shows, bookings, and revenue insights
- Automated tasks via Inngest (seat release after timeout, booking email)
- Email delivery through Brevo (SMTP)

## Tech Stack

- Frontend: React 19, Vite 7, React Router 7, Tailwind CSS 4, Clerk React
- Backend: Node.js, Express 5, Mongoose 8, Clerk Express, Stripe, Inngest
- Data/Infra: MongoDB, TMDB API, Brevo SMTP, (optional) Cloudinary for uploads

## Project Structure

- client/ — React SPA (Vite) and UI assets
- server/ — Express API, Stripe webhooks, Inngest functions, MongoDB models
- public/ — static assets served by Vite

## Prerequisites

- Node.js 20+
- npm (bundled with Node)
- MongoDB cluster/instance
- TMDB API token (v4 Bearer)
- Stripe account (test mode is fine)
- Clerk project (for auth)

## Environment Variables

### Client (`client/.env`)

- VITE_BASE_URL=http://localhost:3000
- VITE_CLERK_PUBLISHABLE_KEY=<your_clerk_publishable_key>
- VITE_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p/w500
- VITE_CURRENCY=$

### Server (`server/.env`)

- MONGODB_URI=mongodb://localhost:27017/movie (or full Mongo connection string)
- CLERK_SECRET_KEY=<your_clerk_secret_key>
- TMDB_API_KEY=<tmdb_api_v4_bearer_token>
- STRIPE_SECRET_KEY=<stripe_secret_key>
- STRIPE_WEBHOOK_SECRET=<stripe_webhook_signing_secret>
- SMTP_USER=<brevo_smtp_username>
- SMTP_PASS=<brevo_smtp_password>
- SENDER_EMAIL=<from_email_address>
- APP_NAME="Movie Booking Team" (optional, used in emails)
- (optional, for uploads) CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_UPLOAD_PRESET

## Setup

1. Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

2. Add the environment variables shown above
3. Start the API

```bash
cd server
npm run dev
```

4. Start the frontend

```bash
cd client
npm run dev
# Vite prints the local URL (default: http://localhost:5173)
```

## Stripe Webhook (local dev)

Stripe Checkout requires a live webhook to mark bookings paid.

```bash
# From the server folder (replace <secret> with the webhook secret shown after forwarding)
stripe listen --forward-to http://localhost:3000/api/stripe
export STRIPE_WEBHOOK_SECRET=<secret>
```

## Image Upload Specs & Performance Optimization

### Image Service Configuration

- Recommended service: Cloudinary (dependency already included on the server)
- Env vars: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_UPLOAD_PRESET
- Formats: JPG/PNG/WEBP; limit uploads to ~2MB to keep pages fast
- Suggested dimensions: posters 1000x1500 (2:3), backdrops 1920x1080 (16:9)
- Caching: serve transformed, width-capped URLs (e.g., `/upload/w_800,q_auto`)
- If you keep using TMDB art, continue to set VITE_TMDB_IMAGE_BASE_URL for CDN-hosted images

### Performance Optimizations Implemented

- **Lazy Loading**: All movie images use native `loading="lazy"` attribute to defer offscreen images
- **Responsive Images**: `srcset` and `sizes` attributes for serving optimal image sizes per device
- **Image Preloading**: Hero section backgrounds are preloaded to eliminate flickering
- **Optimized TMDB Sizes**:
  - Movie cards: w300 (small screens) → w500 (larger screens)
  - Movie posters: w500 → w780 for detail pages
  - Cast thumbnails: w185 (optimized for small circular avatars)
- **Loading Skeletons**: Animated placeholders while images load for better UX
- **Smooth Transitions**: Fade-in effects when images finish loading

## Useful Scripts

- Frontend: `npm run dev`, `npm run build`, `npm run preview`, `npm run lint`
- Backend: `npm run dev` (nodemon)

## Notes

- API base URL defaults to http://localhost:3000; override via VITE_BASE_URL
- Inngest jobs handle seat release if payment is not completed and send booking emails after Stripe confirmation
