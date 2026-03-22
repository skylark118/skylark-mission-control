# Mission Control

Real-time dashboard for monitoring the Skylark 118 agent team (Stella, Cora, Remy, Penny).

## Features

- **Real-time Activity Feed**: Live updates of agent actions via Supabase Realtime
- **Agent Status Overview**: Monitor all agents at a glance
- **Activity Filtering**: Filter by agent, event type, and status
- **Dark Mode**: Built-in theme toggle
- **Mobile Responsive**: Works on all screen sizes

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React, TypeScript
- **UI**: shadcn/ui, Tailwind CSS, Lucide icons
- **Database**: Supabase (Postgres + Realtime)
- **Deployment**: Vercel
- **Virtualization**: @tanstack/react-virtual for performance

## Setup

### 1. Database Schema

Run the SQL in `mission-control-schema.sql` in your Supabase SQL Editor.

### 2. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

Get your Supabase credentials from: https://app.supabase.com/project/YOUR_PROJECT/settings/api

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment

### Deploy to Vercel

```bash
vercel --prod
```

Set environment variables in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `WEBHOOK_SECRET` (generate a random string)

## Webhook API

Send events to the dashboard:

```bash
curl -X POST https://your-vercel-url.vercel.app/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_WEBHOOK_SECRET" \
  -d '{
    "agent_id": "agent-uuid",
    "event_type": "task_started",
    "action": "morning_briefing",
    "status": "completed",
    "summary": "Generated morning briefing with 3 priorities"
  }'
```

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/        # Dashboard routes
│   └── api/events/         # Webhook endpoint
├── components/
│   ├── ui/                 # shadcn components
│   ├── activity/           # Activity feed components
│   └── dashboard/          # Dashboard components
├── lib/
│   ├── supabase/           # Supabase clients
│   └── hooks/              # Custom hooks
└── types/                  # TypeScript types
```

## License

MIT
