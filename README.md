# PharmaPin

PharmaPin is a pharmacy discovery and management platform that connects patients with nearby pharmacies, lets pharmacists manage inventory, and provides authentication and administrative tools. This repository contains a Node/Express backend (MongoDB + Mongoose) and a React frontend (Vite).

This README covers how the project is structured, how to run it locally, environment variables, API overview, and development tips
## Table of contents
- Project status
- Architecture & tech stack
- Repo layout
- Prerequisites
- Quickstart (dev)
- Backend — detailed setup
- Frontend — detailed setup
- Environment variables (.env)
- API overview (key endpoints)
- Ordering feature note
- Testing, linting & scripts
- Deployment hints
- Contributing
- Troubleshooting
- License

## Project status
- Core functionality implemented: authentication, user management, pharmacy onboarding, drug searching, geolocation, inventory management, and administrative routes.
- The ordering feature has been intentionally removed/disabled for the time being (see the "Ordering feature note" section). The app otherwise should run locally.

## Architecture & tech stack
- Backend: Node.js, Express, MongoDB (via Mongoose), dotenv, cors
- Frontend: React (Vite), React Router, Axios
- Dev tools: nodemon (backend), Vite (frontend), ESLint

## Repo layout
Top-level:

- `/backend` — Express API, Mongoose models, route handlers
	- `server.js` — app bootstrap and route registration
	- `routes/` — express route files (auth, users, pharmacies, drugs, inventory, patients, admin, etc.)
	- `models/` — Mongoose models
	- `middleware/` — Express middleware (auth, uploads, admin auth)

- `/frontend` — React application using Vite
	- `src/` — React source (components, pages, context, hooks, styles)
	- `public/` — static assets

Other files: top-level README, package.json files under `frontend` and `backend`.

## Prerequisites
- Node.js (recommended >= 18)
- npm or yarn
- MongoDB (local running instance or cloud like Atlas)

## Quickstart (development)
Open two terminals (one for backend, one for frontend).

Backend (from repository root):

```bash
cd backend
npm install
# copy .env.example to .env and edit
npm run dev   # starts nodemon server.js
```

Frontend (from repository root):

```bash
cd frontend
npm install
npm run dev   # starts vite dev server at http://localhost:5173 by default
```

The frontend is configured to proxy API calls to `http://localhost:5000` by default (see `frontend/package.json`). The backend default port is 5000.

## Backend — detailed setup

1. Install dependencies

```bash
cd backend
npm install
```

2. Environment variables

Create a `.env` file in `/backend` (see the `.env` example below).

3. Run server

```bash
npm run dev    # requires nodemon (dev dep)
# or
npm start
```

The server exposes a health endpoint at `GET /api/health`.

## Frontend — detailed setup

1. Install dependencies

```bash
cd frontend
npm install
```

2. Run Vite dev server

```bash
npm run dev
```

3. Build for production

```bash
npm run build
npm run preview
```

## Environment variables

Backend (recommended `.env` values)

```
# backend/.env
MONGODB_URI=mongodb://localhost:27017/pharmapin
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=30d
# For file uploads, if used
# UPLOAD_PATH=./uploads
```

Frontend

- The frontend uses a proxy configured in `frontend/package.json` to forward API calls to `http://localhost:5000` in development. If you deploy frontend separately, set API base URLs in the code or via an environment variable according to your hosting provider.

## API overview (key endpoints)
The backend registers several routers in `server.js`. Key groups include:

- Authentication: `/api/auth` (register, login, me, check-email)
- Users: `/api/users` (user CRUD and related operations)
- Pharmacies: `/api/pharmacies` (list, details, search)
- Drugs: `/api/drugs` (drug search, details)
- Inventory: `/api/inventory` (pharmacy inventory management)
- Patients: `/api/patients` (patient profile, addresses, favorites)
- Admin: `/api/admin` and `/api/admin/auth` (admin routes)
- Utilities: `/api/patient-search`, `/api/geocode`, `/api/pharmacy-onboarding`, `/api/pharmacy-location`

Note: the ordering router and the Order model were removed/disabled in this branch. Any frontend or code that still attempts to call `/api/orders` will fail until updated.

## Ordering feature note
Per project direction, the ordering feature has been intentionally removed/disabled for now. What changed:

- Backend: `backend/models/Order.js` and `backend/routes/orders.js` were removed, and `server.js` no longer mounts an orders router.
- Frontend: order-related pages/components and routes were removed or converted to placeholders in several places.

If you plan to reintroduce orders later, keep in mind:

1. Recreate a robust `Order` Mongoose model (items, patient, pharmacy, totals, status, payment info, timestamps).
2. Reintroduce secure endpoints under `/api/orders` with authentication and validation.
3. Reconnect frontend flows: checkout, order history, order details, and notification handling.

## Testing, linting & scripts

- Backend scripts (in `backend/package.json`):
	- `npm run dev` — development (nodemon server.js)
	- `npm start` — run server with Node

- Frontend scripts (in `frontend/package.json`):
	- `npm run dev` — start Vite dev server
	- `npm run build` — build for production
	- `npm run preview` — preview production build
	- `npm run lint` — run ESLint

There are no automated tests configured at the moment. Adding unit and integration tests is recommended before shipping.

