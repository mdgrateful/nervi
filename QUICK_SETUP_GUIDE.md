# Quick Setup Guide - Nervi App

## Error You're Seeing

When trying to create an account, you're getting:
```
Error creating account
```

This is because the database tables don't exist yet in Supabase.

## Fix in 3 Steps

### Step 1: Add Environment Variables

Open `.env.local` and add these two lines:

```bash
NEXTAUTH_SECRET=vmqa+A4ZIvOcXK9ztg9+ii1bAUmWNWr5difoxObfPlg=
NEXTAUTH_URL=http://localhost:3010
```

### Step 2: Create Database Tables

1. Open your Supabase Dashboard: https://supabase.com/dashboard
2. Go to your project
3. Click "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy the entire contents of `create-all-tables.sql` file (in your project root)
6. Paste it into the SQL Editor
7. Click "Run" button

You should see a success message and a table showing all 7 tables were created.

### Step 3: Restart Your Dev Server

1. Stop your current dev server (Ctrl+C in the terminal)
2. Start it again:
   ```bash
   npm run dev
   ```

## Test It Works

1. Go to http://localhost:3010/signup
2. Fill in the form:
   - Username: testuser
   - Email: test@example.com
   - Password: password123
   - Confirm Password: password123
3. Click "Create Account"
4. You should be redirected to the dashboard!

## What Was Created

The SQL script created these tables:
- `users` - Authentication with password hashing
- `user_profiles` - User profile data
- `nervi_notes` - Journal entries
- `user_triggers_buffers` - Pattern learning
- `daily_checkins` - Daily tracking
- `micro_actions` - Daily commitments
- `day_of_week_patterns` - Day-specific patterns

## Mobile Features

The app is now fully mobile-responsive:
- Hamburger menu on screens < 768px
- Auth links in top right (Login/Signup or Username/Logout)
- Vertical smartphone compatible
- Touch-friendly interface

## Need Help?

Check these files for detailed info:
- `SETUP_AUTHENTICATION.md` - Full auth system docs
- `SETUP_DAILY_READ.md` - Daily read feature docs
- `SETUP_PROFILE.md` - Profile page docs

## Common Issues

**"Could not find table"** - Run the SQL script in Step 2

**"NEXTAUTH_SECRET is missing"** - Add to `.env.local` in Step 1

**"Session not persisting"** - Make sure cookies are enabled in your browser

**Still seeing errors?** - Restart dev server after adding environment variables
