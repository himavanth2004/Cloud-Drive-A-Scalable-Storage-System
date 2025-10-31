# Cloud Drive: A Scalable Storage System

Simple full-stack starter for a scalable cloud file storage and sharing system.

Features
- User registration / login (JWT)
- File upload / list / download / delete
- Stores files in S3-compatible storage (AWS S3 or MinIO)
- Minimal React frontend to interact with the API
- Docker + docker-compose for local development using MinIO (S3-compatible)

## Quickstart (local, Docker)
1. Copy `.env.example` -> `.env` and adjust values.
2. Start services:
   ```bash
   docker-compose up --build
   ```
3. Backend: http://localhost:4000
   Frontend: http://localhost:3000

## Environment variables (`.env`)
See `.env.example`.

## Notes
- This project is a starter template. For production hardened deployments:
  - Use secure password hashing (bcrypt is used here).
  - Use HTTPS, secure cookies or refresh-token flows.
  - Configure least-privilege IAM policy for S3.
  - Add rate limiting, logging, monitoring, tests.

## Files / Structure
- backend/ - Node.js Express API
- frontend/ - React single-page app
- docker-compose.yml - runs backend, frontend, and MinIO for local S3 emulation

