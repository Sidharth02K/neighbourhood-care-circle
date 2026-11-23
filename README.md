
# Neighbourhood Care Circle

> **Don't just provide care. Create belonging.**

A consent-first community support app that helps older adults build trusted neighbourhood relationships, maintain agreed social routines, coordinate backup support and participate in community activities.

**Live demo:** [Open Neighbourhood Care Circle](https://neighbourhood-care-circle.vercel.app/)

---

## About the Project

Neighbourhood Care Circle is designed to support older adults through trusted, consent-based connections within their neighbourhood. It brings residents, volunteers and coordinators together to help maintain social routines, organise everyday community support and encourage participation in shared activities.

The app focuses on social and everyday community support. It is **not** medical care, emergency dispatch, professional caregiving, or a loneliness or mental-health diagnostic tool.

A missed activity creates a human follow-up according to the resident's preferences. The app never automatically assumes that a missed activity means someone is in danger.

## Features

- **Role-based views:** Resident, volunteer, coordinator and limited family-contact views.
- **Social routines:** Recurrence, status tracking, grace periods and follow-up tasks.
- **Care Circles:** Membership management with approved primary and backup volunteers.
- **Care Relay:** An explicit accept/decline flow when a volunteer is unavailable.
- **Community participation:** Community gatherings, event joining, practical-help requests and Wisdom Exchange.
- **Consent and coordination:** In-app notifications, resident consent/preferences and a coordinator connection map.
- **Application stack:** React/Vite client, Express API, JWT sessions, password hashing and role checks.
- **Database options:** MongoDB for local development or Supabase Postgres for a hosted deployment.

## Requirements

- Node.js 20 or newer and npm.
- MongoDB Community Server for local MongoDB mode, or a Supabase project for hosted database mode.

## Run Locally

### 1. Install Dependencies

Open PowerShell in the project root (the folder containing this README) and run:

```powershell
npm install
```

### 2. Configure the Server Environment

Copy the environment template and open the new file:

```powershell
Copy-Item server/.env.example server/.env
notepad server/.env
```

Replace:

```env
JWT_SECRET=replace-this-with-a-long-random-secret
```

with a long, random secret.

Keep `.env` files private and never commit them to GitHub.

### 3. Choose a Database

**Option A — Local MongoDB**

- Start MongoDB Community Server.
- Keep the default `MONGODB_URI` in `server/.env`.
- Leave both Supabase values blank.

**Option B — Supabase**

- Copy your Supabase project URL into `SUPABASE_URL`.
- Copy the server-only service role key into `SUPABASE_SERVICE_ROLE_KEY`.
- Run [`server/supabase/schema.sql`](server/supabase/schema.sql) once in the Supabase SQL Editor before seeding.

### 4. Seed the Demo Data

```powershell
npm run seed
```

> **Warning:** Seeding replaces the app records in whichever database is selected. Use a development/demo database only. Do not run this command again after real data has been added.

### 5. Start the Application

```powershell
npm run dev
```

### 6. Open the App

- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **API health:** [http://localhost:4000/api/health](http://localhost:4000/api/health)

## Demo Accounts

All demo accounts use the password `Circle2026!`.

| Role | Email |
|---|---|
| Resident — Mr. Sharma | `resident@ncc.demo` |
| Volunteer — Rahul | `volunteer@ncc.demo` |
| Backup volunteer — Priya | `volunteer2@ncc.demo` |
| Coordinator — Maya | `coordinator@ncc.demo` |
| Family contact | `family@ncc.demo` |

The login screen also offers quick demo access.

Family access remains limited unless a resident link and explicit sharing permissions are configured.

## Demo Walkthrough

1. **Resident — Mr. Sharma:** Review **My rhythm** and the approved Care Circle, or create a recurring routine.
2. **Volunteer — Rahul:** Accept or complete an assigned activity, or mark yourself unavailable to start a Care Relay.
3. **Backup volunteer — Priya:** Accept or decline the relay explicitly.
4. **Coordinator — Maya:** Review follow-ups, people and safety, and the connection map. The coordinator can simulate an overdue routine so a follow-up appears without waiting.
5. **Explore as a resident:** Visit **Community**, **Practical help**, **Wisdom Exchange** and **My preferences**.

Local development checks for overdue activities every minute. On Vercel, the API checks due activities when a signed-in client loads its data or follow-ups. The coordinator simulation is available for a live demonstration.

## Deploy to Vercel

The repository includes Vercel configuration. The build produces the Vite client in `public/` and exports the Express application as a Vercel Function.

The frontend and API use the same origin, so the browser does not need a separate `VITE_API_URL` setting.

### 1. Set Up Supabase

Create a Supabase project and run [`server/supabase/schema.sql`](server/supabase/schema.sql) in its SQL Editor.

### 2. Import the Repository into Vercel

Create or import this repository in Vercel with the repository root as the project root.

Use the build command below if Vercel does not read it from `vercel.json`:

```bash
npm run build:vercel
```

### 3. Add Environment Variables

In Vercel project settings, add the following server environment variables for Production and Preview:

| Variable | Value |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase server-only service role key |
| `JWT_SECRET` | A long random secret used to sign app sessions |

Never use the service role key in a `VITE_` variable or in client-side code. Do not put secrets in GitHub.

### 4. Seed the Hosted Database

Deploy the project, then seed the Supabase project once with the same environment values available to the seed command, or import the demo users and records into that project.

The seed command is destructive for existing app data.

### 5. Verify the Deployment

Open the Vercel URL and confirm that `/api/health` returns `ok: true` with the Supabase database. Then sign in with a demo account.

### Database Note

Vercel does not host a persistent MongoDB server. The hosted deployment uses Supabase Postgres; local MongoDB remains available for the local workflow.

The Supabase adapter stores small prototype records in a private JSONB table. It is intended for this prototype, not a high-volume production service.

## API Overview

| Area | Endpoints |
|---|---|
| Authentication and profile | `/api/auth/register`, `/api/auth/login`, `/api/me` |
| App data | `/api/data`, `/api/dashboard`, `/api/map` |
| Preferences and Care Circles | `/api/preferences`, `/api/circles` |
| Activities and relay | `/api/activities`, `/api/activities/:id/status`, `/api/activities/:id/unavailable`, `/api/activities/:id/relay` |
| Follow-ups | `/api/follow-ups`, `/api/follow-ups/:id/resolve`, `/api/rhythm/simulate` |
| Community and help | `/api/events`, `/api/help`, `/api/wisdom` |
| Notifications and volunteer review | `/api/notifications`, `/api/volunteers/:id/review` |

All application APIs except health and authentication require a signed-in session. Coordinator actions are checked on the server. Family access remains limited unless a resident link and sharing permissions are configured.

## Project Structure

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

## Prototype Limits

This is not a production identity-verification or safeguarding system. It does not send real SMS or email, provide emergency services, or implement a complete family invitation workflow.

A live community pilot would need resident-led research, volunteer checks, safeguarding review and explicit operational procedures.
