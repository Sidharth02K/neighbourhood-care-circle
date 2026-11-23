# Neighbourhood Care Circle

A consent-first community support app for the Engineering, Creativity, Innovation and Design Lab. It helps older adults build trusted neighbourhood relationships, keep agreed social routines, coordinate backups and take part in community activities.

**Live demo:** https://neighbourhood-care-circle.vercel.app/

> **Don't just provide care. Create belonging.**

This is a classroom prototype using fictional demo information. It coordinates social and everyday community support. It is not medical care, emergency dispatch, professional caregiving, or a loneliness or mental-health diagnostic tool. A missed activity creates a human follow-up according to resident preferences; the app never automatically assumes danger.

## Features

- Resident, volunteer, coordinator and limited family-contact views.
- Social routines with recurrence, status tracking, grace periods and follow-up tasks.
- Care Circle membership and approved primary/backup volunteers.
- Explicit Care Relay accept/decline flow when a volunteer is unavailable.
- Community gatherings, event joining, practical-help requests and Wisdom Exchange.
- In-app notifications, resident consent/preferences and a coordinator connection map.
- React/Vite client, Express API, JWT sessions, password hashing and role checks.
- MongoDB for local development, or Supabase Postgres for a hosted deployment.

## Requirements

- Node.js 20 or newer and npm
- MongoDB Community Server for local MongoDB mode, or a Supabase project for hosted database mode

## Run locally

1. In PowerShell, open the project root (the folder containing this README) and install dependencies:

   ```powershell
   npm install
   ```

2. Copy the server environment template and set a private JWT secret:

   ```powershell
   Copy-Item server/.env.example server/.env
   notepad server/.env
   ```

   Replace `JWT_SECRET=replace-this-with-a-long-random-secret` with a long random value. Keep `.env` files private; never commit them.

3. Choose the database mode:

   - **Local MongoDB:** start MongoDB Community Server and keep the default `MONGODB_URI` in `server/.env`. Leave both Supabase values blank.
   - **Supabase:** copy the project URL into `SUPABASE_URL` and the server-only service role key into `SUPABASE_SERVICE_ROLE_KEY`. Run [`server/supabase/schema.sql`](server/supabase/schema.sql) once in the Supabase SQL Editor before seeding.

4. Seed the fictional demo data once:

   ```powershell
   npm run seed
   ```

   **Warning:** this replaces the app records in whichever database is selected. Use a development/demo database only. Do not run it again after real data has been added.

5. Start the API and client together:

   ```powershell
   npm run dev
   ```

6. Open [http://localhost:5173](http://localhost:5173). The API health endpoint is [http://localhost:4000/api/health](http://localhost:4000/api/health).

## Demo accounts

All demo accounts use the password `Circle2026!`.

| Role | Email |
|---|---|
| Resident · Mr. Sharma | `resident@ncc.demo` |
| Volunteer · Rahul | `volunteer@ncc.demo` |
| Backup volunteer · Priya | `volunteer2@ncc.demo` |
| Coordinator · Maya | `coordinator@ncc.demo` |
| Family contact | `family@ncc.demo` |

The login screen also offers quick demo access. Family access stays limited unless a resident link and explicit sharing permissions are configured.

## Demo walkthrough

1. Sign in as Mr. Sharma. Review **My rhythm** and the approved Care Circle, or create a recurring routine.
2. Sign in as Rahul. Accept or complete an assigned activity, or mark yourself unavailable to start a Care Relay.
3. Sign in as Priya. Accept or decline the relay explicitly.
4. Sign in as Maya. Review follow-ups, people and safety, and the connection map. The coordinator can simulate an overdue routine so a follow-up appears without waiting.
5. Return as a resident to explore **Community**, **Practical help**, **Wisdom Exchange** and **My preferences**.

Local development checks for overdue activities every minute. On Vercel, the API checks due activities when a signed-in client loads its data or follow-ups. The coordinator simulation is available for a live demonstration.

## Deploy to Vercel

The repository includes Vercel configuration. The build produces the Vite client in `public/` and exports the Express application as a Vercel Function. The API and frontend use the same origin, so the browser does not need a separate `VITE_API_URL` setting.

1. Create a Supabase project and run [`server/supabase/schema.sql`](server/supabase/schema.sql) in its SQL Editor.
2. Create/import this repository in Vercel with the repository root as the project root. Use the build command `npm run build:vercel` if Vercel does not read it from `vercel.json`.
3. In Vercel project settings, add these server environment variables for Production and Preview:

   | Variable | Value |
   |---|---|
   | `SUPABASE_URL` | Your Supabase project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase server-only service role key |
   | `JWT_SECRET` | A long random secret used to sign app sessions |

   Never use the service role key in a `VITE_` variable or in client-side code. Do not put secrets in GitHub.

4. Deploy. Seed the Supabase project once with the same environment values available to the seed command, or import the demo users and records into that project. The seed command is destructive for existing app data.
5. Open the Vercel URL and confirm `/api/health` returns `ok: true` with the Supabase database. Then sign in with a demo account.

Vercel does not host a persistent MongoDB server. The hosted deployment uses Supabase Postgres; local MongoDB remains available for the original local workflow. The Supabase adapter stores small prototype records in a private JSONB table and is intended for this classroom demo, not a high-volume production service.

## API overview

- Authentication and profile: `/api/auth/register`, `/api/auth/login`, `/api/me`
- App data: `/api/data`, `/api/dashboard`, `/api/map`
- Preferences and Care Circles: `/api/preferences`, `/api/circles`
- Activities and relay: `/api/activities`, `/api/activities/:id/status`, `/api/activities/:id/unavailable`, `/api/activities/:id/relay`
- Follow-ups: `/api/follow-ups`, `/api/follow-ups/:id/resolve`, `/api/rhythm/simulate`
- Community and help: `/api/events`, `/api/help`, `/api/wisdom`
- Notifications and volunteer review: `/api/notifications`, `/api/volunteers/:id/review`

All application APIs except health and authentication require a signed-in session. Coordinator actions are checked on the server. Family access remains limited unless a resident link and sharing permissions are configured.

## Project structure

```text
client/                    React + Vite interface
server/src/app.js          Express app shared by local and Vercel runs
server/src/routes/api.js   Authentication and feature endpoints
server/src/models/         MongoDB and Supabase data adapters
server/src/jobs/           Social Rhythm follow-up logic
server/supabase/schema.sql Supabase database setup
src/index.js               Vercel Express function entry point
scripts/                   Deployment build helpers
```

## Prototype limits

This is not production identity verification or a safeguarding system. It does not send real SMS or email, provide emergency services, or implement a complete family invitation workflow. A live community pilot would need resident-led research, volunteer checks, safeguarding review and explicit operational procedures.
