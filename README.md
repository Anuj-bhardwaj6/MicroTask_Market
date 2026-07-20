# Microtask Marketplace — MERN Setup

This project is a full MERN stack app: React + Vite + Tailwind on the
frontend, Node.js + Express + MongoDB on the backend, living side by side
(`server/`).

> **The UI was not redesigned.** No colors, typography, spacing, layouts, or
> routes changed. The **Task** feature set (Client dashboard, task
> list/browse, task details, and the post/edit task form) now runs entirely
> on live MongoDB data through the existing components — every "static card"
> in those views renders real documents fetched via React Query.

## Project layout

```
.
├── src/                      # Frontend (unchanged UI)
│   ├── api/                  # NEW: API service layer
│   │   ├── axiosInstance.js  # Axios instance + interceptors
│   │   ├── endpoints.js      # Centralized endpoint paths
│   │   └── services/         # One file per resource (auth, tasks, chat, ...)
│   ├── store/                # NEW: Redux Toolkit
│   │   ├── store.js
│   │   └── slices/           # auth, tasks, ui
│   ├── lib/
│   │   └── queryClient.js    # NEW: React Query client
│   ├── hooks/api/            # NEW: example React Query hooks (useTasks.js)
│   └── ...                   # existing pages/components/layouts, untouched
│
└── server/                   # NEW: Express + MongoDB backend
    ├── config/               # env.js, db.js (Mongoose connection)
    ├── controllers/          # auth, task, application, chat, notification, wallet, user
    ├── middleware/           # auth, errorHandler, rateLimiter, validate
    ├── models/               # User, Task, Application, Message, Notification, Transaction
    ├── routes/                # one router per resource + index.js
    ├── services/              # emailService (stub, swap for real provider)
    ├── sockets/                # socket.io setup for realtime chat
    ├── validators/             # express-validator chains
    ├── utils/                  # ApiError, ApiResponse, asyncHandler, generateToken, seed.js
    ├── app.js                  # Express app + middleware pipeline
    └── server.js                # HTTP + socket.io bootstrap
```

## Backend — what's configured

- **Express** app in `server/app.js`
- **Helmet** for security headers
- **Morgan** for request logging (`dev` in development, `combined` in production)
- **CORS** locked to `CLIENT_URL`, with credentials enabled for cookie auth
- **dotenv** via `server/config/env.js`
- **Compression** (gzip)
- **Rate limiting** (`express-rate-limit`) — a general API limiter plus a
  stricter limiter on auth routes
- **cookie-parser** for httpOnly auth cookies
- **express-validator** request validation chains per route, run through a
  shared `validate` middleware that formats errors consistently
- **Global error handler** (`middleware/errorHandler.js`) that normalizes
  Mongoose validation/cast/duplicate-key errors and any thrown `ApiError`
  into a single JSON shape: `{ success, message, errors, stack? }`
- **MongoDB via Mongoose** (`config/db.js`) — connects on boot; if MongoDB is
  unreachable the server still starts (health checks and static routes keep
  working) and logs a clear warning instead of crashing
- **Socket.io** initialized in `server.js` for realtime chat/notifications

### Backend routes

| Resource       | Base path            |
|----------------|-----------------------|
| Health check   | `GET /api/health`     |
| Auth           | `/api/auth/*` (register, login, logout, refresh-token, me, forgot/reset password, otp) |
| Tasks          | `/api/tasks`          |
| Applications   | `/api/applications`   |
| Chat           | `/api/chat`            |
| Notifications  | `/api/notifications`   |
| Wallet / Payments | `/api/wallet/*` (see Payment system section below) |
| Users (admin)  | `/api/users`           |

### Payment system (escrow, Stripe, wallet)

Implemented in `server/controllers/walletController.js` / `server/routes/walletRoutes.js`
+ `server/routes/webhookRoutes.js`, backed by three models
(`Wallet`, `Transaction`, and an `escrow` sub-document on `Task`), and
consumed from the frontend via `src/hooks/api/useWallet.js`.

**Money flow:** Client funds a task's escrow → funds are held (`Task.escrow.status = "held"`)
→ client marks the task Completed → client releases payment → the amount is
credited to the freelancer's `Wallet.balance` → freelancer requests a
withdrawal → an admin settles it.

| Feature | Route | Notes |
|---|---|---|
| Wallet balance + lifetime totals | `GET /api/wallet/me` | Creates an empty wallet on first access |
| Transaction / ledger history | `GET /api/wallet/transactions` | Filter by `type`, `status`, `task`; paginated |
| Manual ledger adjustment | `POST /api/wallet/transactions` | Admin only |
| Fund escrow for a hired task | `POST /api/wallet/tasks/:taskId/pay` | Client only, task must be assigned. Creates a Stripe Checkout session when Stripe keys are configured; otherwise **dev-simulated**: escrow is marked `held` immediately so the full flow is testable without live keys |
| Payment status poll | `GET /api/wallet/tasks/:taskId/payment-status` | Used right after returning from Stripe Checkout |
| Stripe webhook | `POST /api/wallet/webhook` | Handles `checkout.session.completed` (holds escrow), `checkout.session.expired` / `payment_intent.payment_failed` (marks the payment Failed). Mounted with `express.raw()` **before** the app's JSON body parser so signature verification works |
| Release payment | `POST /api/wallet/tasks/:taskId/release-payment` | Client/admin only, requires `task.status === "Completed"` and `escrow.status === "held"`. Credits the freelancer's wallet atomically |
| Refund escrow | `POST /api/wallet/tasks/:taskId/refund` | Client/admin only, requires `escrow.status === "held"`. Issues a real Stripe refund when the original charge went through Stripe |
| Request withdrawal | `POST /api/wallet/withdraw` | `{ amount, method }`; earmarks the amount out of `Wallet.balance` immediately and files a `Processing` transaction |
| List withdrawals | `GET /api/wallet/withdrawals` | Own withdrawals; admins can pass `?all=true` to see everyone's |
| Settle a withdrawal | `PATCH /api/wallet/withdrawals/:id/status` | Admin only, `{ status: "Completed" \| "Failed" }`. `Failed` returns the funds to the wallet |

**Realtime updates:** every wallet-affecting action emits a `wallet:updated`
socket event to the affected user(s) (`server/controllers/walletController.js`).
The frontend's `SocketContext` listens for it and invalidates all
`["wallet", ...]` react-query caches, so the Wallet page and task escrow
badges update automatically without a manual refresh.

**Running it locally:**
- No Stripe keys → the "Fund escrow" button on a task's details page holds
  the escrow instantly (dev-simulated), no external calls made.
- With Stripe test keys (`STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` in
  `server/.env`) → "Fund escrow" redirects to a real Stripe Checkout page;
  use Stripe's `4242 4242 4242 4242` test card. Forward webhooks locally with
  `stripe listen --forward-to localhost:5000/api/wallet/webhook` and copy the
  printed signing secret into `STRIPE_WEBHOOK_SECRET`.

### Task feature set (live MongoDB data)

Every route below is implemented in `server/controllers/taskController.js` /
`server/routes/taskRoutes.js` and consumed from the frontend via
`src/hooks/api/useTasks.js`:

| Feature | Route | Notes |
|---|---|---|
| List / search / filter / paginate | `GET /api/tasks` | `search`, `category`, `status`, `priority`, `page`, `limit`; `mine=true` returns the caller's own tasks (all stages), otherwise only `published` tasks are visible |
| Task details | `GET /api/tasks/:id` | |
| Create (as Draft, or publish immediately) | `POST /api/tasks` | `publish: true` in the body publishes on creation |
| Edit | `PATCH /api/tasks/:id` | title, description, category, budget, deadline, priority, skills, progress |
| Publish | `PATCH /api/tasks/:id/publish` | Draft → Published |
| Archive | `PATCH /api/tasks/:id/archive` | hides without deleting |
| Delete | `DELETE /api/tasks/:id` | also removes any Cloudinary attachments |
| Task status | `PATCH /api/tasks/:id/status` | `Open / In Progress / Completed / Cancelled / Expired`; `Expired` is set automatically by `Task.autoExpire()` whenever a task with a past deadline is read |
| Upload attachments | `POST /api/tasks/:id/attachments` | multipart, field name `files` (up to 5, 10MB each) — streamed to Cloudinary via Multer memory storage |
| Delete attachment | `DELETE /api/tasks/:id/attachments/:attachmentId` | |
| Dashboard statistics | `GET /api/tasks/dashboard/stats` | role-aware: client/freelancer/admin each get 4 stat cards computed from the Task collection |
| Recent tasks | `GET /api/tasks/dashboard/recent` | powers the Dashboard "Recent tasks" card |
| Activity feed | `GET /api/notifications/activity` | every create/publish/archive/status-change/upload writes an activity entry (`server/utils/activityLog.js`), shown on the Dashboard "Activity feed" card |

File uploads require Cloudinary credentials (see Environment variables
below); without them the upload endpoint returns a clear 400 instead of a
confusing SDK error, and the rest of the Task feature set works normally.

## Environment variables

**Backend** (`server/.env`, copy from `server/.env.example`):

```
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://127.0.0.1:27017/microtask_marketplace

# Access token (short-lived) + refresh token (long-lived, powers persistent login)
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=replace_with_a_different_long_random_secret
JWT_REFRESH_EXPIRES_IN=30d
COOKIE_SECRET=replace_with_a_long_random_secret

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=300

# SMTP - leave blank in development to log verification/reset emails to the
# console instead of sending them for real.
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=MicroTask Market <no-reply@microtask.local>

# Cloudinary - required for task attachment uploads (Multer + Cloudinary).
# Get these from your Cloudinary dashboard; leave blank in development and
# uploads will return a clear error instead of failing silently.
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

**Frontend** (`.env` at project root, copy from `.env.example`):

```
VITE_API_URL=/api
```

`VITE_API_URL=/api` works with the Vite dev proxy configured in
`vite.config.js`, which forwards `/api/*` to `http://localhost:5000` in
development so there's no CORS friction. In production, point it at your
deployed API origin (e.g. `https://api.yourdomain.com/api`) or keep `/api`
and reverse-proxy it alongside the built frontend.

## Running everything

Install dependencies once for each app:

```bash
npm install               # frontend
npm run server:install    # backend (installs server/node_modules)
```

Start MongoDB locally (or point `MONGO_URI` at Atlas/another instance), then
run both apps:

```bash
npm run dev:all           # frontend (5173) + backend (5000) together
# or separately:
npm run dev                # frontend only
npm run server              # backend only
```

Optional: seed the database with the same sample records the frontend
currently displays statically:

```bash
npm run server:seed
```

## Frontend integration layer

- **Axios** (`src/api/axiosInstance.js`) — a shared instance with
  `withCredentials: true` so the httpOnly `accessToken`/`refreshToken`
  cookies flow with every request, a response interceptor that silently
  exchanges an expired access token for a new one via
  `POST /auth/refresh-token` and retries the original request once (this is
  what powers persistent login across reloads), and normalizes every error
  to `{ status, message, errors, code }`.
- **API service layer** (`src/api/services/*.js`) — one file per resource
  (`authService`, `taskService`, `applicationService`, `chatService`,
  `notificationService`, `walletService`, `userService`), all built on the
  shared Axios instance and the centralized paths in `src/api/endpoints.js`.
- **`src/context/AuthContext.jsx`** is the real, backend-wired source of
  truth for the logged-in user (no more dummy/demo accounts). It bootstraps
  the session from the httpOnly cookies on load, exposes
  `login`/`register`/`logout`/`updateUser`, and an `isLoading` flag that
  `AuthLayout`/`DashboardLayout` use to avoid a redirect flash while that
  bootstrap check is in flight.
- **Auth flow**: register/login set an `accessToken` (15m) + `refreshToken`
  (30d, `path=/api/auth`) httpOnly cookie pair. New accounts start
  unverified and are routed to `/otp-verification` to enter the emailed
  code; the same OTP page/pipeline (`purpose=verify-email` vs.
  `purpose=reset-password`) is reused for the forgot-password flow, which
  exchanges a verified OTP for a short-lived reset token consumed by
  `/reset-password`.
- **Note:** the register form's role selector (kept as-is for UI parity)
  lets anyone self-register as `admin`. That matches the original
  prototype's demo-account picker, but before shipping this to production
  you'll want to remove `"admin"` from `registerValidator`'s allowed roles
  in `server/validators/authValidators.js` and provision admins some other
  way (seed script, invite flow, promote-in-DB, etc).
- **Redux Toolkit** (`src/store/`) — `authSlice` (with `loginUser`,
  `registerUser`, `fetchCurrentUser`, `logoutUser` thunks wired to
  `authService`), `taskSlice` (filters/selection UI state), and `uiSlice`
  (sidebar/toast state). Wired into the app via `<Provider store={store}>`
  in `main.jsx`. `AuthContext` remains the source of truth the UI actually
  reads from; this slice is available for any Redux-connected code.
- **React Query** (`src/lib/queryClient.js`) — `QueryClientProvider` wraps
  the app in `main.jsx`. `src/hooks/api/useTasks.js` is the live data layer
  for every Task feature (`useTasksQuery`, `useTaskQuery`,
  `useTaskStatsQuery`, `useRecentTasksQuery`, `useActivityFeedQuery`,
  `useCreateTaskMutation`, `useUpdateTaskMutation`, `useDeleteTaskMutation`,
  `usePublishTaskMutation`, `useArchiveTaskMutation`,
  `useUpdateTaskStatusMutation`, `useUploadAttachmentsMutation`,
  `useDeleteAttachmentMutation`), consumed directly by `DashboardHome`,
  `TaskListPage`, `TaskDetailsPage`, and `PostTaskPage`.

### What still uses `sampleData.js`

Everything outside the Task feature set (public landing page, applicants
list on the task details side panel, chat, wallet, notifications list, and
the generic admin utility tables) intentionally keeps its existing sample
data — those features weren't part of this pass and rewiring them wasn't
requested. `categories` also stays as a static list (it's form/filter copy,
not a data card).

## What was verified

- Every backend file changed in this pass (`server/**`) was checked with
  `node --check` and an `esbuild` syntax pass.
- Every frontend file changed in this pass (`src/**`) was checked with an
  `esbuild` JSX/ESM parse pass.
- `npm install` could not be run in this sandbox (no network egress), so
  `npm install && npm run server:install` followed by `npm run server:seed`
  and `npm run dev:all` should be your first steps to actually exercise the
  API end-to-end and confirm MongoDB connectivity + Cloudinary uploads.
