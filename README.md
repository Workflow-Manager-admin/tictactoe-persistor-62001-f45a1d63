# Tic Tac Toe Frontend (React)

This is the web UI for the persistent Tic Tac Toe application. It handles authentication/login, game lobby, live board play, and user history, communicating with the backend API.

---

## Quick Start

1. **Install dependencies:**

   ```bash
   cd tic_tac_toe_frontend
   npm install
   ```

2. **Bootstrap dev environment:**

   - Default development port is `3000`.
   - The frontend expects the backend to be available at `http://localhost:3001` (can be changed in `src/App.js`, see `API_URL`).

3. **Run the app:**

   ```bash
   npm start
   ```
   Then open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

There is no default `.env` used in this template, but you may create `REACT_APP_API_URL` for custom backend API address:

```
# .env SAMPLE for frontend
REACT_APP_API_URL=http://localhost:3001
```

Alternatively, change the `API_URL` at the top of `src/App.js` directly for dev/test.

---

## API Endpoints Used

| Action                | Endpoint                         | Auth Required |
|-----------------------|----------------------------------|--------------|
| Register              | POST /users/register             | No           |
| Login                 | POST /users/login                | No           |
| Start/Join Game       | POST /games, POST /games/:id/join| Yes          |
| Make Move             | POST /games/:id/move             | Yes          |
| Get Game State        | GET /games/:id                   | Yes          |
| User Game History     | GET /users/:id/games             | Yes          |

---

## Service Ports

- **Frontend UI**: `http://localhost:3000`
- **Expects Backend API**: `http://localhost:3001`
- **Backend expects DB**: `localhost:5000` (see backend/database READMEs)

---

## Cross-Container Usage

- Start the backend API (`uvicorn ...` at port `3001`) _before_ running the frontend dev server.
- Authentication flows and all stateful board/game operations depend on backend endpoints.

---

## Customization & Configuration

- For custom API endpoints, either:
    - Set `REACT_APP_API_URL` in a `.env` file.
    - Or update `const API_URL = ...` at the top of `src/App.js`.
- Default UI ports can be changed by modifying the `start` script or via `PORT` env var.

---

## Developer Notes

- All setup is zero-config for the provided backend+database, just run all three containers with matching port/env settings.
- For additional customization, see `src/App.js` and `src/App.css` for UI logic and theming.

---
