# AI Recruiter

A simple production-ready full-stack recruiter assistant:

- React + Vite + Tailwind frontend
- Node.js + Express backend
- MongoDB persistence
- Clerk authentication
- Mock candidate matching
- LLM-backed chat simulation with a deterministic fallback
- Interest scoring and ranked shortlist

## Folder Structure

```txt
ai-recruiter/
  client/
    src/
      components/
      lib/
      App.jsx
      main.jsx
      index.css
    .env.example
    package.json
    vite.config.js
    tailwind.config.js
    postcss.config.js
  server/
    src/
      config/
      data/
      middleware/
      models/
      routes/
      services/
      app.js
      index.js
    .env.example
    package.json
  package.json
  README.md
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment files:

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

3. Fill in Clerk and MongoDB values:

Client:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key
VITE_API_URL=http://localhost:5000/api
```

Server:

```env
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/ai-recruiter
CLERK_PUBLISHABLE_KEY=pk_test_your_key
CLERK_SECRET_KEY=sk_test_your_key
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

During local development, the server also falls back to `client/.env`'s `VITE_CLERK_PUBLISHABLE_KEY`, but setting `CLERK_PUBLISHABLE_KEY` in `server/.env` is recommended.

`OPENAI_API_KEY` is optional. Without it, the chat uses a deterministic local simulation so the app still works.

4. Run MongoDB locally or use MongoDB Atlas.

5. Start the app:

```bash
npm run dev
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:5000`

## API

All recruiter APIs are protected by Clerk auth. Send `Authorization: Bearer <Clerk session token>`.

- `GET /api/health` - server health
- `GET /api/candidates` - mock candidates
- `POST /api/jobs` - save a job description
- `GET /api/jobs` - list recruiter jobs
- `POST /api/match` - rank candidates against a job description
- `GET /api/shortlist/:jobId` - fetch final ranked shortlist for a job
- `POST /api/chat` - simulate recruiter-candidate chat and update interest score

## Production Notes

- Use Clerk JWTs between frontend and backend.
- Set `CLIENT_ORIGIN` to the deployed frontend URL.
- Use MongoDB Atlas with IP allowlisting.
- Keep `CLERK_SECRET_KEY` and `OPENAI_API_KEY` only on the server.
- Replace mock candidates with a real `Candidate` collection when ready.
