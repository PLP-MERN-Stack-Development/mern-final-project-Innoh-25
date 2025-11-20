# API Reference — Key Endpoints

This file gives a quick reference to the main API endpoints implemented in the backend.

Base URL (development): http://localhost:5000

Auth
- POST /api/auth/register — register new user (payload: name, email, password, role...)
- POST /api/auth/login — login (payload: email, password)
- GET /api/auth/me — get current user (protected)

Admin
- POST /api/admin/auth/login — admin login
- /api/admin — admin-only management routes (protected by admin middleware)

Users
- GET /api/users — list users (protected/admin)
- GET /api/users/:id — get user

Pharmacies
- GET /api/pharmacies — list and search pharmacies
- GET /api/pharmacies/:id — pharmacy details

Drugs
- GET /api/drugs — drug search
- GET /api/drugs/:id — drug details

Inventory
- GET /api/inventory/:pharmacyId — pharmacy inventory
- POST /api/inventory — add/update inventory (protected)

Patients
- GET /api/patients/:id — patient profile
- POST /api/patients — create/update patient data

Utilities
- GET /api/patient-search — public drug availability search near a location
- GET /api/geocode — geocoding helpers

Health
- GET /api/health — simple JSON payload confirming the server is up

Notes
- The original Orders endpoints were intentionally removed/disabled in this branch; reintroduce them carefully if needed.
