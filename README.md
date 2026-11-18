# SafeKeep — Personal Document Vault

SafeKeep is a full-stack starter for a private personal document vault. It includes a React interface, Express API, PostgreSQL/Prisma data model, in-memory access-token authentication, per-user authorization, private local uploads, notifications, and authenticated SSE.

## Features

- Registration and login with bcrypt password hashing and short-lived signed access tokens.
- Access tokens remain in JavaScript memory; no browser storage is used for credentials.
- Private upload directory, randomized storage keys, upload size/type limits, and basic file-signature checks.
- Owner-scoped document list, detail, download, and delete endpoints.
- Search, category filtering, sorting, pagination, and multi-file upload UI.
- Persisted notifications, unread counts, read actions, and per-user SSE streams.
- Responsive dashboard, document list, upload, profile settings, empty/loading states, and accessible toast feedback.

## Stack and layout

- `frontend/`: React 18, Vite, React Router, Axios, Lucide.
- `backend/`: Express API, authentication, authorization, upload handling, and notifications.
- `database/`: Prisma schema and migration history for PostgreSQL.

The backend is explicitly built with Express (`backend/src/server.js` starts the Express app). The folders are separate at the project root so frontend code, server code, and database schema/migrations are easy to locate.

## Prerequisites and setup

Use Node.js 20+. From this directory:

```sh
npm install
npm --prefix backend install
npm --prefix frontend install
```

Create `backend/.env` from `backend/.env.example`. Set `DATABASE_URL` to a PostgreSQL connection URL and generate a random `JWT_ACCESS_SECRET` with at least 32 characters. Adjust `CLIENT_URL`, `UPLOAD_DIR`, and `MAX_FILE_SIZE_MB` as needed. The API validates required configuration at startup.

Generate Prisma and apply the database migrations from the `database/` schema:

```sh
npm run db:generate
npm --prefix backend run db:deploy
```

Run both development servers:

```sh
npm run dev
```

The client runs at `http://localhost:5173`, the API at `http://localhost:4000`. Set client `VITE_API_URL` if the API is hosted elsewhere. Build the UI with `npm run build`.

## API

All API routes are under `/api`.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Liveness check |
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Sign in |
| POST | `/auth/logout` | End client session |
| GET | `/auth/me` | Restore/check current in-memory session |
| GET/PATCH | `/profile` | Read/update profile name |
| POST | `/documents/upload` | Upload one multipart `file` (plus optional category/title) |
| GET | `/documents?page=1&limit=12&search=&category=&sort=newest` | List owner documents |
| GET | `/documents/:id` | Read owner document metadata |
| GET | `/documents/:id/download` | Stream owner file |
| DELETE | `/documents/:id` | Delete owner file and metadata |
| GET | `/notifications` | List notifications and unread count |
| GET | `/notifications/unread-count` | Get unread count |
| PATCH | `/notifications/:id/read` | Mark one read |
| PATCH | `/notifications/read-all` | Mark all read |
| GET | `/notifications/stream` | Authenticated SSE stream |

Errors use `{ "error": { "code": "...", "message": "..." } }`. Authenticated endpoints require `Authorization: Bearer <access-token>`.

## Authentication and security notes

Passwords are hashed with bcrypt. Access JWTs are signed with a configured secret and short expiry (default 15 minutes). The React client keeps the token in memory only; reloading the page ends that session and requires signing in again. This project intentionally does not implement refresh cookies or silent refresh. The notification panel uses a fetch-based SSE stream with bearer authorization and exponential reconnect delay, avoiding tokens in URLs.

Document ownership is derived from the verified token, never a client-supplied owner id. Private files are stored outside the client public directory under randomized keys and are only streamed through an authenticated route. The server checks a short signature prefix for supported formats, with Office files checked as ZIP containers. Do not serve `UPLOAD_DIR` statically. Set restrictive filesystem permissions and back up the database and files together.

This starter is not a claim of production security. Before deployment, perform a security review; configure TLS, secure infrastructure and backups, malware scanning/content disarm for uploads, robust file-format parsing, observability, and operational limits. Refresh-token rotation, CSRF, account recovery, email verification, document preview, and object-storage adapter are not implemented. No secrets should be committed.

## Tests

Run `npm test`. Backend test files use Node's test runner; frontend uses Vitest. Add integration tests against an isolated PostgreSQL database before production use. Database migrations live in `database/prisma/migrations`.

## Troubleshooting

- **Config validation fails:** copy `backend/.env.example` to `backend/.env`, replace the database URL, and set a JWT secret of 32+ characters.
- **Database connection errors:** start PostgreSQL, create the `safekeep` database, then rerun `npm run db:migrate`.
- **CORS errors:** make `CLIENT_URL` exactly match the browser origin.
- **Upload rejected:** use PDF, JPEG, PNG, DOCX, or XLSX under the configured size limit.
- **Session ends after refresh:** access tokens are intentionally memory-only; sign in again (refresh flow is an explicit follow-up).

<!-- CI/CD pipeline verification -->
