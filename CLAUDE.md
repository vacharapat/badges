# Badge App — Project Notes

## What this is

A web app for Kasetsart University (@ku.th) where teachers assign digital badges to students in courses. Students track their badge progress. Built with Next.js 14, Prisma/SQLite, and Google OAuth.

## Current status

All code has been written. **The app has not been run yet** — Node.js was not installed on the machine when the project was scaffolded. The next step is to install Node.js and do the initial setup.

## First-time setup (do this once)

```bash
# 1. Install Node.js (PowerShell, then restart terminal)
winget install OpenJS.NodeJS.LTS

# 2. Install dependencies
npm install

# 3. Push the database schema (creates prisma/dev.db)
npm run db:push

# 4. Seed the admin user (reads ADMIN_EMAIL from .env.local)
npm run db:seed

# 5. Start the dev server
npm run dev
```

Then open http://localhost:3000

## Environment variables (.env.local)

Fill these in before running — the file already exists with placeholders:

| Variable | Where to get it |
|---|---|
| `GOOGLE_CLIENT_ID` | Google Cloud Console → APIs & Services → Credentials |
| `GOOGLE_CLIENT_SECRET` | Same as above |
| `NEXTAUTH_SECRET` | Any random string (run `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | `http://localhost:3000` for local dev |
| `ADMIN_EMAIL` | Your own @ku.th email — this account becomes admin |
| `DATABASE_URL` | `file:./dev.db` (SQLite, no setup needed) |

Google OAuth redirect URI to add: `http://localhost:3000/api/auth/callback/google`

## Roles

| Role | How assigned | What they can do |
|---|---|---|
| ADMIN | Seeded via `ADMIN_EMAIL` env var | Manage user roles at `/admin/users` |
| TEACHER | Admin promotes a user | Create courses, add badges, enroll students, award badges |
| STUDENT | Default for all @ku.th logins | View enrolled courses, track badge progress |

Only `@ku.th` Google accounts can log in at all (enforced in `src/lib/auth.ts`).

## Key flows

**Teacher creates a course:**
1. `/teacher/courses` → New → fill name/description
2. Course page → add Badge (upload image, name, missions list)
3. Course page → Students tab → Add Student → search by email → Enroll
4. Students tab → expand a student → Award/revoke individual badges

**Student tracks progress:**
1. `/courses` → see all enrolled courses with progress bars
2. Click a course → badge grid (earned = color, locked = gray)
3. Tap any badge → modal showing missions list

## Project structure

```
badge_app/
├── prisma/
│   ├── schema.prisma       # DB models: User, Course, Badge, Enrollment, StudentBadge
│   └── seed.ts             # Seeds the ADMIN_EMAIL user as ADMIN role
├── src/
│   ├── lib/
│   │   ├── auth.ts         # NextAuth config, domain guard, role in session
│   │   ├── db.ts           # Prisma singleton
│   │   └── utils.ts        # cn(), parseMissions()
│   ├── types/
│   │   └── next-auth.d.ts  # Extends Session type with id and role
│   ├── components/
│   │   ├── Navbar.tsx      # Bottom nav + CourseHeader component
│   │   ├── BadgeCard.tsx   # Single badge tile (earned vs locked style)
│   │   ├── BadgeModal.tsx  # Badge detail popup with missions list
│   │   └── ProgressBar.tsx # Gold progress bar with X/Y count
│   └── app/
│       ├── page.tsx                          # Login page (redirects if already logged in)
│       ├── courses/page.tsx                  # Student: list of enrolled courses
│       ├── courses/[id]/page.tsx             # Student: badge grid for a course
│       ├── courses/[id]/badges-grid.tsx      # Client: interactive badge grid + modal
│       ├── teacher/courses/page.tsx          # Teacher: course list
│       ├── teacher/courses/new/              # Teacher: create course form
│       ├── teacher/courses/[id]/page.tsx     # Teacher: course detail (badges + students)
│       ├── teacher/courses/[id]/teacher-course-client.tsx  # Client: award badges, enroll students
│       ├── teacher/courses/[id]/badges/new/  # Teacher: create badge form (with image upload)
│       ├── admin/users/page.tsx              # Admin: user list
│       ├── admin/users/admin-users-client.tsx # Client: role switcher
│       └── api/
│           ├── auth/[...nextauth]/route.ts   # NextAuth handler
│           ├── upload/route.ts               # Image upload → /public/uploads/
│           ├── courses/route.ts              # GET (list), POST (create)
│           ├── courses/[id]/route.ts         # GET, PATCH, DELETE
│           ├── courses/[id]/badges/route.ts  # POST (add badge to course)
│           ├── courses/[id]/enrollments/route.ts # GET (unenrolled students), POST, DELETE
│           ├── badges/[id]/route.ts          # PATCH, DELETE
│           ├── badges/[id]/award/route.ts    # POST (award), DELETE (revoke)
│           └── admin/users/route.ts          # GET (all users), PATCH (change role)
├── public/uploads/         # Badge images stored here
├── .env.local              # Secrets — fill this in before running
├── SETUP.md                # Quick setup guide
└── CLAUDE.md               # This file
```

## Tech stack

| Tool | Version | Purpose |
|---|---|---|
| Next.js | 14.2 | Framework (App Router) |
| TypeScript | 5 | Type safety |
| Tailwind CSS | 3.4 | Styling |
| NextAuth.js | 4.x | Google OAuth + sessions |
| Prisma | 5.x | ORM |
| SQLite | — | Database (file: prisma/dev.db) |
| lucide-react | — | Icons |

## Design notes

- Color palette: primary blue `#1B4F8A`, gold `#F5A623` for progress bar
- Earned badges: full color. Unearned: `grayscale opacity-30`
- Mobile-first layout with max-w-lg container, fixed bottom nav
- Badge images uploaded to `/public/uploads/` and served statically

## Known limitations / future work

- Badge images are stored on the local filesystem (`/public/uploads/`). For production, replace with cloud storage (e.g. Cloudinary or S3).
- SQLite is fine for development/small scale. For production, switch `provider` in `prisma/schema.prisma` to `postgresql` and update `DATABASE_URL`.
- No email notifications when a badge is awarded.
- Teachers can only see their own courses (admins see all).
- Students cannot self-enroll; teachers must add them manually.
