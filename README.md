# Suka Beauty — Full-Stack Beauty E-Commerce App

A complete, production-oriented beauty brand e-commerce app: Node.js/Express + PostgreSQL
backend, JWT auth, Razorpay payments, Cloudinary image uploads,
Gmail SMTP notifications, and a real order lifecycle (tracking, cancel, return, refund).

## What's included

**Backend** (`/backend`)
- Auth: register, login, forgot/reset password, JWT sessions
- Roles: customer & admin (role-based route protection)
- Products: categories, brand/skin-type/price filters, search + autocomplete, reviews & ratings
- Cart & Wishlist: persisted server-side per logged-in user
- Orders: checkout → Razorpay payment → signature-verified confirmation → status tracking
  (placed → packed → shipped → out for delivery → delivered), cancel, return request,
  admin return approval, refund status, PDF invoice generation
- Admin: dashboard stats, product CRUD with Cloudinary image upload, order status updates,
  return/refund handling, user management, category management
- Database: Sequelize ORM — **SQLite for zero-setup local dev**, **PostgreSQL for production**
  (just flip one env var)

**Frontend** (`/frontend`)
- Your original Home / login / register / cart pages, now wired to the real API
- New pages: `forgot-password.html`, `reset-password.html`,
  `product.html` (detail + reviews), `wishlist.html`, `orders.html` (tracking/cancel/return/invoice),
  `account.html` (profile + addresses), `admin.html` (full admin dashboard)
- `js/api.js` — one shared file with every API call, used by all pages

## 1. Install & run locally (no database setup needed)

```bash
cd backend
npm install
cp .env.example .env
npm run seed     # creates an admin user + sample categories/products
npm run dev       # starts on http://localhost:5000
```

Local dev uses **SQLite** by default (`DB_DIALECT=sqlite` in `.env`) — a file
(`database.sqlite`) is created automatically, no install or server required.

Open `http://localhost:5000` — the backend also serves the `frontend` folder directly, so
the whole app runs from one URL. (If you prefer a separate frontend dev server, just point
its API calls at `http://localhost:5000/api` — `js/api.js` uses relative paths, so serving
both from the same origin, as above, is simplest.)

**Default admin login** (from `.env.example` — change these before going live):
- Email: `admin@sukabeauty.com`
- Password: `Admin@12345`

## 2. Connect real services

### Razorpay (payments)
1. Sign up at https://dashboard.razorpay.com (free).
2. Go to **Settings → API Keys**, generate a **Test Mode** key pair first.
3. Put them in `.env`:
   ```
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
   ```
4. Test payments with Razorpay's [test card/UPI numbers](https://razorpay.com/docs/payments/payments/test-card-upi-details/).
5. When ready for real transactions, complete Razorpay's KYC and switch to **Live Mode** keys.

### Cloudinary (product image uploads)
1. Sign up at https://cloudinary.com (free tier is generous).
2. From your Cloudinary dashboard, copy **Cloud Name**, **API Key**, **API Secret** into `.env`:
   ```
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   ```
3. Product images uploaded from the admin panel go straight to Cloudinary and are served
   from their CDN — no local file storage needed.

### Gmail SMTP (password reset / order emails)
1. Turn on 2-Step Verification on the Gmail account you want to send from.
2. Create an **App Password**: Google Account → Security → App passwords → generate one
   for "Mail".
3. Put them in `.env`:
   ```
   GMAIL_USER=youraddress@gmail.com
   GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx   # 16-character app password, no spaces
   ```
   Until you set these, the backend just logs emails to the console — handy for testing
   without a real inbox.

## 3. Switch to PostgreSQL for production

In `.env`:
```
DB_DIALECT=postgres
DATABASE_URL=postgres://user:password@host:5432/dbname
NODE_ENV=production
```
Sequelize will auto-create all tables on first boot (`sequelize.sync()` in `server.js`).
For a real production app you'd eventually migrate to versioned migrations instead of
`sync()`, but this gets you running immediately.

## 4. Deploy to Render / Railway (free tier)

1. Push this project to a GitHub repo.
2. On Render/Railway: **New → Web Service**, point at the repo, root directory `backend`.
3. Build command: `npm install`   Start command: `npm start`
4. Add a free **PostgreSQL** add-on/service; copy its connection string into `DATABASE_URL`.
5. Set all the other `.env` variables (Razorpay, Cloudinary, Gmail, JWT_SECRET) in the
   host's environment variable settings.
6. Set `CLIENT_URL` to your deployed URL (used in password-reset email links and CORS).
7. Once deployed, run the seed script once (Render/Railway both offer a one-off "shell" or
   "job" run): `npm run seed`.

The frontend is served by the same Express app (`express.static`), so a single deployed
service hosts everything — no separate frontend hosting needed.

## API reference (quick overview)

| Area | Endpoint | Notes |
|---|---|---|
| Auth | `POST /api/auth/register` `/login` `/forgot-password` `/reset-password` | |
| Users | `GET/PUT /api/users/profile`, `/api/users/addresses` (CRUD) | requires login |
| Products | `GET /api/products` (filters: search, category, brand, skinType, minPrice, maxPrice, sort, page) | public |
| Products | `POST/PUT/DELETE /api/products` | admin, multipart image upload |
| Reviews | `GET/POST /api/products/:id/reviews` | |
| Wishlist | `GET/POST/DELETE /api/wishlist` | requires login |
| Cart | `GET/POST/PUT/DELETE /api/cart` | requires login |
| Orders | `POST /api/orders`, `/verify-payment`, `GET /mine`, `GET /:id`, `GET /:id/invoice`, `POST /:id/cancel`, `POST /:id/return` | |
| Admin orders | `GET /api/orders/admin/all`, `PUT /admin/:id/status`, `/return-decision`, `/complete-refund` | admin |
| Admin | `GET /api/admin/dashboard`, `/users`, `PUT /users/:id/toggle-role` | admin |

## Notes on what's simplified (be aware for a real launch)

- **Refunds**: cancelling a paid order marks `refundStatus: pending` and flips `paymentStatus`
  to `refunded` — it does **not** call Razorpay's refund API automatically. Wire up
  `razorpay.payments.refund(paymentId, ...)` in `orderController.js` (`cancelOrder` /
  `adminCompleteRefund`) before going live so money actually moves back.
- **Coupons**: the checkout UI has a demo coupon code (`SUKA15`) hardcoded client-side —
  there's no coupon table/API yet. Easy to add as a `Coupon` model if you need real promo codes.
- **Shipping/tax**: flat ₹49 shipping (free over ₹999) and flat 5% tax are hardcoded in
  `orderController.js` — swap in real shipping-rate/tax logic for your region as needed.
- **`sequelize.sync()`**: fine for getting started; for a live app with real customer data,
  move to `sequelize-cli` migrations so schema changes don't risk data loss.
