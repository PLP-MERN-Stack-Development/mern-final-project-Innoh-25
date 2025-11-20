# Testing

This document explains how to run the unit and end-to-end tests locally and what the CI workflow does.

Frontend (unit tests with Vitest)

1. Install dependencies (from repo root):

```bash
cd frontend
npm install --legacy-peer-deps
```

2. Run unit tests (watch):

```bash
npm test
```

3. Run tests once (CI-style):

```bash
npm run test:run
```

Frontend (E2E with Cypress)

1. Build the frontend and serve it locally:

```bash
cd frontend
npm run build
npx serve -s dist -l 3000
```

2. In another terminal run Cypress (headed):

```bash
npm run cy:open
```

3. Or run headless (CI-style):

```bash
npm run cypress:run-ci
```

Backend (tests)

Backend tests are implemented with Jest + Supertest. To run them locally:

```bash
cd backend
npm install
npm test
```

CI behavior

- The GitHub Actions pipeline runs backend tests and frontend unit tests. It also builds the frontend. A dedicated E2E job builds the frontend, serves it on port 3000, and runs Cypress headlessly.
