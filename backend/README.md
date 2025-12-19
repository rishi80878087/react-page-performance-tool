# React Page Performance Tool - Backend

Backend API server for the Page Performance Tool built with Node.js and Express.

## Features

- Express.js server
- CORS enabled for frontend communication
- Health check endpoint
- Error handling middleware
- Environment variable support

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional):
```env
PORT=5000
FRONTEND_URL=http://localhost:3000
```

4. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The server will run on `http://localhost:5000`

## API Endpoints

### GET /api/health
Health check endpoint to verify server is running.

**Response:**
```json
{
  "status": "success",
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456
}
```

### GET /
Root endpoint with API information.

**Response:**
```json
{
  "message": "Page Performance Tool API",
  "version": "1.0.0",
  "endpoints": {
    "health": "/api/health",
    "analyze": "/api/analyze (coming soon)"
  }
}
```

## Project Structure

```
backend/
├── src/
│   └── server.js          # Main server file
├── package.json
├── .env                   # Environment variables (create this)
└── README.md
```

## Environment Variables

- `PORT` - Server port (default: 5000)
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:3000)

## Next Steps

- [ ] Add `/api/analyze` endpoint
- [ ] Integrate Lighthouse
- [ ] Add URL validation
- [ ] Add report processing
- [ ] Add error handling for Lighthouse

## Notes

- The server uses ES modules (type: "module" in package.json)
- CORS is configured to allow requests from the frontend
- Health check endpoint is ready for monitoring

