# Architecture Overview

This document gives a short overview of the application's technical architecture and reasoning.

Tech stack
- Backend: Node.js + Express, MongoDB via Mongoose
- Frontend: React + Vite
- Realtime: Socket.io (planned/optional for notifications)
- Auth: JWT for stateless API auth

Structure
- `backend/` — API server, models, middleware, routes
- `frontend/` — React SPA served by Vite in development and built for production

Key decisions
- Keep API stateless; user sessions handled with JWTs stored securely on client
- Separate concerns: routers, controllers, models to improve testability
- Non-critical features (orders) were removed to focus on core discovery and inventory flows

Deployment notes
- Deploy backend to a Node host (Heroku/Render/Cloud Run/EC2) with a MongoDB Atlas cluster
- Deploy frontend to static host (Netlify, Vercel) and configure API URL
