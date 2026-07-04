# MarketPulse: Real-Time Market Data Dashboard

MarketPulse is a full-stack real-time market data tracker that displays NIFTY Spot, NIFTY Futures, OHLC Session statistics, total Volume, VWAP, and Index Market Breadth. It features a premium, glassmorphic UI styled with CSS blurs, supporting a dark/light mode toggle and custom ticker animations.

---

## Tech Stack

- **Frontend**: React.js (Vite), React Router, Lucide Icons, Vanilla CSS.
- **Backend**: Node.js, Express.js, Axios (proxy API client).
- **APIs**: DhanHQ REST API (for market quotes).

---

## Monorepo Project Structure

- `backend/`: Express server act as a proxy client to pull quotes and bypass browser CORS limits.
- `frontend/`: React Vite app styled with glassmorphism blurs (`bg-main.svg` vectors).

---

## Environment Variables Configuration

Create a `.env` file inside the `backend/` directory:

```env
PORT=5000
DHAN_CLIENT_ID=your_dhan_client_id_here
DHAN_ACCESS_TOKEN=your_dhan_access_token_here
```

### How to get DhanHQ API Credentials
1. Go to the [DhanHQ Portal](https://dhanhq.co/) and log in with your credentials.
2. Navigate to your **Profile** page -> **API Access**.
3. Generate your **Access Token** and copy the Client ID.
4. Insert them into your `backend/.env` file.
5. If you do not have live trading credentials, keep the variables empty. The backend will **automatically detect this and gracefully fallback to Sandbox Mode** with ticking simulated data!

---

## Getting Started

### 1. Root Installation
From the root of the project, run:
```bash
npm run install:all
```
This runs the dependency installers inside both the `/frontend` and `/backend` subfolders.

### 2. Run the Backend Server
Navigate to the backend directory and run:
```bash
cd backend
npm run dev
```
The server will start on `http://localhost:5000`.

### 3. Run the Frontend App
Open a separate terminal, navigate to the frontend directory and run:
```bash
cd frontend
npm run dev
```
Open `http://localhost:5173` to see the live ticking dashboard.

---

## Evaluation Checklist & Justification

| Feature | Status | Implementation Justification |
| :--- | :--- | :--- |
| **Real-Time Data** | `[x]` | Live tracking of NIFTY Spot, NIFTY Futures, OHLC values, Volume, VWAP, and Advances/Declines/Unchanged breadth counts. |
| **Sandbox Simulation** | `[x]` | Built an in-memory random walk simulator that provides ticking prices when offline or outside trading hours. |
| **Dhan API Proxy** | `[x]` | Bypasses browser CORS restrictions by calling Dhan APIs through the Express proxy server. |
| **Error Handling** | `[x]` | Implements graceful controller fallbacks. If Dhan connection errors out or credentials are empty, it switches to Sandbox Mode with a UI alert instead of crashing. |
| **Export Feature** | `[x]` | Generates structured columnar CSV downloads. Automatically formats filenames with timestamp patterns like `Market_Data_YYYY-MM-DD_HH-MM-SS_AM/PM.csv`. |
| **Glassmorphism UI** | `[x]` | Implemented CSS custom variables with `backdrop-filter: blur(20px)` and vector background blurs. Ticker cards flash green/red on price updates. |
