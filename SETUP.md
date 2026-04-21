# Badge App Setup Guide

## 1. Install Node.js (if not installed)

Run in PowerShell or Command Prompt:
```
winget install OpenJS.NodeJS.LTS
```
Restart your terminal after installing.

## 2. Install dependencies

```bash
cd Desktop/badge_app
npm install
```

## 3. Set up Google OAuth

1. Go to https://console.cloud.google.com/
2. Create a new project (or use an existing one)
3. Go to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client IDs**
5. Application type: **Web application**
6. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
7. Copy the **Client ID** and **Client Secret**

## 4. Configure environment variables

Edit `.env.local` and fill in:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
NEXTAUTH_SECRET=any_random_32char_string
NEXTAUTH_URL=http://localhost:3000
ADMIN_EMAIL=your_email@ku.th
DATABASE_URL="file:./dev.db"
```

For `NEXTAUTH_SECRET`, run this in bash: `openssl rand -base64 32`
Or just use any long random string.

## 5. Set up the database

```bash
npm run db:push
npm run db:seed
```

## 6. Start the app

```bash
npm run dev
```

Open http://localhost:3000

## How it works

- **Login**: All @ku.th Google accounts can sign in. Default role is Student.
- **Admin**: The email in `ADMIN_EMAIL` is seeded as Admin.
- **Making teachers**: Admin logs in → goes to Users → changes a user's role to Teacher.
- **Teacher flow**: Create course → Add badges (with image + missions) → Enroll students → Award badges.
- **Student flow**: See enrolled courses → Click a course → View badge grid → Tap a badge to see missions.
