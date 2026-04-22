# Badge App — Project Notes

## What this is

A web app for Kasetsart University (@ku.th) where teachers assign digital badges to students in courses. Students track their badge progress. Built with Next.js, Prisma/PostgreSQL, and Google OAuth.

## Current status

**App is live on Railway and running locally.**

- Production: Railway (auto-deploys from `master` branch on GitHub)
- Local dev: `npm run dev` → http://localhost:3000

Local dev uses the Railway PostgreSQL database (public URL in `.env.local`).

## Local dev

```bash
npm run dev
```

Sign in with your `@ku.th` Google account. Local dev shares the Railway PostgreSQL database.

## Environment variables (.env.local)

| Variable | Value |
|---|---|
| `GOOGLE_CLIENT_ID` | Google Cloud Console → APIs & Services → Credentials |
| `GOOGLE_CLIENT_SECRET` | Same as above |
| `NEXTAUTH_SECRET` | Any random string (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | `http://localhost:3000` for local dev |
| `ADMIN_EMAIL` | `vacharapat.m@ku.th` |
| `DATABASE_URL` | Railway PostgreSQL public URL (TCP proxy URL from Railway → PostgreSQL service → Settings → Networking) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary dashboard → Settings → Account |
| `CLOUDINARY_API_KEY` | Cloudinary dashboard → Settings → Access Keys |
| `CLOUDINARY_API_SECRET` | Same as above |

Google OAuth redirect URIs to add:
- `http://localhost:3000/api/auth/callback/google` (local)
- `https://your-railway-url.up.railway.app/api/auth/callback/google` (production)

## Railway deployment

Deployed at: configure via Railway dashboard (Settings → Networking → Generate Domain)

On every deploy, Railway automatically runs:
```
npx prisma db push && npx tsx prisma/seed.ts && npm start
```
(configured in `railway.toml`)

Railway environment variables needed:
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`, `ADMIN_EMAIL`
- `NEXTAUTH_URL` = your Railway public URL
- `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` (Railway internal reference)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

## Promoting a user to admin

The seed runs automatically on deploy but requires the user to have logged in via Google first. If you need to manually promote a user:

```bash
dotenv -e .env.local -- node -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.user.update({where:{email:'vacharapat.m@ku.th'},data:{role:'ADMIN'}}).then(u=>console.log('Done:',u.email,u.role)).catch(console.error).finally(()=>p.\$disconnect())"
```

## Roles

| Role | How assigned | What they can do |
|---|---|---|
| ADMIN | Seeded via `ADMIN_EMAIL` env var | Manage user roles at `/admin/users` |
| TEACHER | Admin promotes a user | Create courses, add badges, enroll students, award badges |
| STUDENT | Default for all @ku.th logins | View enrolled courses, track badge progress |

Only `@ku.th` and `*.ku.th` Google accounts can log in (enforced in `src/lib/auth.ts`).

## Key flows

**Teacher creates a course:**
1. `/teacher/courses` → New → fill name/description
2. Course page → add Badge (upload image, name, missions list)
3. Course page → Badges tab → pencil icon to edit, trash icon to delete a badge
4. Course page → Students tab → Add Student → search by email → Enroll
5. Students tab → expand a student → Award/revoke individual badges

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
│       ├── teacher/courses/[id]/teacher-course-client.tsx  # Client: award badges, enroll students, edit/delete badges
│       ├── teacher/courses/[id]/badges/new/  # Teacher: create badge form (with image upload)
│       ├── admin/users/page.tsx              # Admin: user list
│       ├── admin/users/admin-users-client.tsx # Client: role switcher
│       └── api/
│           ├── auth/[...nextauth]/route.ts   # NextAuth handler
│           ├── upload/route.ts               # Image upload → Cloudinary
│           ├── courses/route.ts              # GET (list), POST (create)
│           ├── courses/[id]/route.ts         # GET, PATCH, DELETE
│           ├── courses/[id]/badges/route.ts  # POST (add badge to course)
│           ├── courses/[id]/enrollments/route.ts # GET (unenrolled students), POST, DELETE
│           ├── badges/[id]/route.ts          # PATCH, DELETE
│           ├── badges/[id]/award/route.ts    # POST (award), DELETE (revoke)
│           └── admin/users/route.ts          # GET (all users), PATCH (change role)
├── public/uploads/         # (legacy) local uploads — no longer used; images go to Cloudinary
├── railway.toml            # Railway deploy config: db push + seed + start
├── .npmrc                  # legacy-peer-deps=true (eslint peer dep workaround)
├── .env.local              # Secrets — never commit this
└── CLAUDE.md               # This file
```

## Tech stack

| Tool | Version | Purpose |
|---|---|---|
| Next.js | 16.2 | Framework (App Router) |
| TypeScript | 5 | Type safety |
| Tailwind CSS | 3.4 | Styling |
| NextAuth.js | 4.x | Google OAuth + sessions |
| Prisma | 5.x | ORM |
| PostgreSQL | — | Database (Railway managed) |
| lucide-react | — | Icons |

## Design notes

- Color palette: primary blue `#1B4F8A`, gold `#F5A623` for progress bar
- Earned badges: full color. Unearned: `grayscale opacity-30`
- Mobile-first layout with max-w-lg container, fixed bottom nav
- Badge images uploaded to Cloudinary (`badge-app/` folder) and served via Cloudinary CDN URLs

## Known limitations / future work

- No email notifications when a badge is awarded.
- Teachers can only see their own courses (admins see all).
- Students cannot self-enroll; teachers must add them manually.
