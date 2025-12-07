# Authentication System Setup

## Overview

Complete authentication system with:
- Username/password login
- Secure signup with all profile fields
- Password hashing with bcrypt
- Session management with NextAuth.js
- Protected routes

## Setup Instructions

### 1. Add Environment Variable

Add this line to your `.env.local` file:

```bash
NEXTAUTH_SECRET=vmqa+A4ZIvOcXK9ztg9+ii1bAUmWNWr5difoxObfPlg=
NEXTAUTH_URL=http://localhost:3010
```

### 2. Create Database Table

Run this SQL in your Supabase Dashboard:

```sql
-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL, -- UUID generated on signup
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  state TEXT,
  work_start_time TIME,
  work_end_time TIME,
  allow_work_notifications BOOLEAN DEFAULT false,
  profile_picture_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 3. Restart Development Server

After adding the environment variable, restart your dev server:

```bash
# Stop current server (Ctrl+C)
npm run dev
```

## Features

### Login Page (`/login`)

- Username and password fields
- Error messages for invalid credentials
- Link to signup page
- Theme toggle
- Auto-redirects to dashboard on successful login

### Signup Page (`/signup`)

All profile fields are included in signup:

**Required Fields:**
- Username (min 3 characters)
- Email (valid email format)
- Password (min 8 characters)
- Confirm Password (must match)

**Optional Fields:**
- Profile picture upload (max 5MB)
- State selection (all 50 US states)
- Work start time
- Work end time
- Allow work notifications checkbox

**Features:**
- Real-time password match validation
- Profile picture preview
- Duplicate username/email detection
- Auto-login after successful signup
- Redirects to dashboard

### Security Features

1. **Password Hashing**
   - Uses bcrypt with 12 rounds
   - Passwords never stored in plain text
   - One-way encryption

2. **Session Management**
   - JWT-based sessions
   - 30-day session expiration
   - Secure httpOnly cookies

3. **Input Validation**
   - Username: minimum 3 characters
   - Email: valid email format required
   - Password: minimum 8 characters
   - Duplicate prevention (username/email)

4. **Error Handling**
   - Generic error messages (doesn't reveal if username exists)
   - Failed login attempts don't expose user info
   - Server-side validation for all inputs

## API Endpoints

### POST `/api/signup`

Creates a new user account.

**Request:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepass123",
  "state": "CA",
  "workStartTime": "09:00",
  "workEndTime": "17:00",
  "allowWorkNotifications": false,
  "profilePictureUrl": "data:image/..."
}
```

**Response (Success):**
```json
{
  "success": true,
  "user": {
    "userId": "uuid-here",
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

**Response (Error):**
```json
{
  "error": "Username already taken"
}
```

### POST `/api/auth/[...nextauth]`

NextAuth.js handles:
- `/api/auth/signin` - Login
- `/api/auth/signout` - Logout
- `/api/auth/session` - Get current session
- `/api/auth/csrf` - CSRF token

## Using Authentication in Your App

### Get Current User

```javascript
import { useSession } from "next-auth/react";

function MyComponent() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (status === "unauthenticated") {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <p>Welcome, {session.user.username}!</p>
      <p>Email: {session.user.email}</p>
      <p>User ID: {session.user.userId}</p>
    </div>
  );
}
```

### Protect a Page

```javascript
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return <div>Protected content</div>;
}
```

### Logout Button

```javascript
import { signOut } from "next-auth/react";

function LogoutButton() {
  return (
    <button onClick={() => signOut({ callbackUrl: "/login" })}>
      Logout
    </button>
  );
}
```

## User Flow

1. **New User:**
   - Visits `/signup`
   - Fills in all profile information
   - Clicks "Create Account"
   - Account created with hashed password
   - Auto-logged in
   - Redirected to `/dashboard`

2. **Returning User:**
   - Visits `/login`
   - Enters username and password
   - Password verified against hash
   - Session created
   - Redirected to `/dashboard`

3. **Session Persistence:**
   - Session lasts 30 days
   - User stays logged in across browser sessions
   - Session stored in httpOnly cookie (secure)

## Database Schema

```
users table:
├─ id (BIGSERIAL, primary key)
├─ user_id (TEXT, unique) - UUID for public use
├─ username (TEXT, unique)
├─ email (TEXT, unique)
├─ password_hash (TEXT) - bcrypt hash
├─ state (TEXT) - US state code
├─ work_start_time (TIME)
├─ work_end_time (TIME)
├─ allow_work_notifications (BOOLEAN)
├─ profile_picture_url (TEXT)
├─ created_at (TIMESTAMP)
├─ updated_at (TIMESTAMP) - auto-updates
└─ last_login (TIMESTAMP) - updates on each login
```

## Testing

### Test Signup

1. Go to http://localhost:3010/signup
2. Fill in the form:
   - Username: testuser
   - Email: test@example.com
   - Password: password123
   - Confirm Password: password123
   - (optional fields)
3. Click "Create Account"
4. Should redirect to dashboard

### Test Login

1. Go to http://localhost:3010/login
2. Enter credentials:
   - Username: testuser
   - Password: password123
3. Click "Sign In"
4. Should redirect to dashboard

### Test Session

1. After logging in, refresh the page
2. Should still be logged in (session persists)
3. Close browser and reopen
4. Visit any page - should still be logged in

## Security Best Practices

1. **Never log passwords** - Even in error messages
2. **Use HTTPS in production** - Cookies marked secure
3. **Rotate NEXTAUTH_SECRET** - If compromised
4. **Monitor failed login attempts** - Implement rate limiting if needed
5. **Keep dependencies updated** - npm audit regularly

## Troubleshooting

### "NEXTAUTH_SECRET is missing"
Add to `.env.local`: `NEXTAUTH_SECRET=vmqa+A4ZIvOcXK9ztg9+ii1bAUmWNWr5difoxObfPlg=`

### "Could not find the table 'users'"
Run the SQL migration in Supabase Dashboard

### "Username already taken"
Username must be unique - try a different one

### Session not persisting
Check that cookies are enabled in browser

### Redirect loop on login
Ensure NEXTAUTH_URL matches your domain

## Files Created

- `/app/api/auth/[...nextauth]/route.js` - NextAuth configuration
- `/app/api/signup/route.js` - Signup endpoint
- `/app/login/page.js` - Login page
- `/app/signup/page.js` - Signup page
- `/supabase/migrations/create_users_table.sql` - Database schema
