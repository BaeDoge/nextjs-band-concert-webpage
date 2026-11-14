# BAND NIGHT

A mobile-first concert invitation website that brings event information and audience participation together in one place.

**Live demo:** https://daeil-band.vercel.app

## Features

- Event schedule, venue information, map links, band members, and setlist
- Audience nickname registration, emoji cheers, questions, and RSVP responses
- Admin dashboard for reviewing visitor activity and audience messages
- Activity gallery and a static photo archive for the post-event page
- Post-event mode that keeps the main content available without database requests

## Technology

| Area | Stack |
| --- | --- |
| Frontend | Next.js, React, JavaScript |
| Database | Supabase |
| Hosting | Vercel |
| Media | WebP images and video |

## Getting started

Requirements: Node.js 22 LTS or later, npm, and a Supabase project.

    git clone https://github.com/BaeDoge/nextjs-band-concert-webpage.git
    cd nextjs-band-concert-webpage
    npm install

Create a local environment file:

    copy .env.example .env.local

Set the following variables in .env.local:

| Variable | Description |
| --- | --- |
| SUPABASE_URL | Supabase project URL |
| SUPABASE_SECRET_KEY | Server-side Supabase secret key |
| ADMIN_ACCESS_KEY | Password for the admin page |

Run the SQL in supabase/schema.sql in the Supabase SQL Editor, then start the development server:

    npm run dev

Open http://localhost:3000.

## Available scripts

    npm run dev
    npm run build
    npm run start

## Deployment

Import the repository into Vercel and configure the same environment variables in the project settings. Pushes to the connected production branch trigger a new deployment.

## Security and privacy

Supabase credentials and the admin access key must remain server-side. Do not expose them through NEXT_PUBLIC variables or commit them to Git.

Audience identification currently uses a browser identifier rather than a full account system. Moderation is therefore browser-specific and may not identify the same person across devices or private browsing sessions. The project is designed for a small event workflow, not as a general-purpose identity or access-management service.
