# User Profile Setup Instructions

## Overview

The User Profile page allows users to:
- Set their username, email, and state
- Configure work hours for smart notification scheduling
- Upload a profile picture
- Access their conversation history
- Control whether to receive notifications during work hours

## Database Setup

Run this SQL in your Supabase Dashboard → SQL Editor:

```sql
-- Create user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  username TEXT,
  email TEXT,
  state TEXT, -- US state abbreviation (e.g., 'CA', 'NY')
  work_start_time TIME, -- e.g., '09:00:00'
  work_end_time TIME, -- e.g., '17:00:00'
  allow_work_notifications BOOLEAN DEFAULT false,
  profile_picture_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster user_id lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function before updates
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Features

### 1. Profile Picture Upload
- Users can upload an image file (max 5MB)
- Supported formats: JPG, PNG, GIF, WebP
- Currently stores as data URL (in production, should use Supabase Storage)
- Displays circular preview of uploaded image

### 2. Work Hours Configuration
- Users set their work start/end times
- System uses this to:
  - Adjust daily schedule recommendations
  - Time notifications appropriately
  - Respect "do not disturb" preferences during work hours

### 3. Notification Preferences
- Checkbox: "Allow notifications during work hours"
- If unchecked, notifications will only be sent outside work hours
- Future integration with Daily Read feature for smart notification timing

### 4. State Selection
- Dropdown with all 50 US states
- Can be used for:
  - Timezone detection
  - State-specific resources
  - Regional pattern analysis

### 5. History Access
- Button on profile page to access conversation history
- History removed from main navigation bar
- Keeps user data accessible without cluttering nav

## Files Created

### API Routes
- `/app/api/profile/route.js` - Get and save user profile data

### Pages
- `/app/profile/page.js` - User profile form and settings

### Database Migrations
- `/supabase/migrations/create_user_profiles_table.sql`

### Modified Files
- `/app/components/SharedNav.js` - Replaced "History" with "Profile" button

## Navigation Changes

**Before:**
```
Chat | Dashboard | Notes | Life Story | History | 🌙
```

**After:**
```
Chat | Dashboard | Notes | Life Story | Profile | 🌙
```

Users can now access History from the Profile page via the "View History" button.

## Future Enhancements

### Smart Notification Timing
Once you create the database table, the Daily Read feature can use work hours:

```javascript
// Example: Check if current time is during work hours
function isDuringWorkHours(profile) {
  if (!profile.work_start_time || !profile.work_end_time) {
    return false; // No work hours set
  }

  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"

  return currentTime >= profile.work_start_time
    && currentTime <= profile.work_end_time;
}

// Example: Adjust notification timing
function shouldSendNotification(profile, reminderTime) {
  const isDuringWork = isDuringWorkHours(profile);

  if (isDuringWork && !profile.allow_work_notifications) {
    return false; // Don't send during work if not allowed
  }

  return true;
}
```

### Profile Picture Storage
Currently profile pictures are stored as data URLs in the database. For production:

1. Enable Supabase Storage in your project
2. Create a bucket called `profile-pictures`
3. Update the upload logic:

```javascript
async function uploadProfilePicture(file, userId) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('profile-pictures')
    .upload(fileName, file);

  if (error) throw error;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('profile-pictures')
    .getPublicUrl(fileName);

  return publicUrl;
}
```

## Testing

1. **Create the database table** using the SQL above
2. **Visit the Profile page** at http://localhost:3010/profile
3. **Fill in your information:**
   - Username: "test-user"
   - Email: "test@example.com"
   - State: California
   - Work hours: 9:00 AM - 5:00 PM
   - Upload a profile picture
4. **Click "Save Profile"**
5. **Refresh the page** - your data should persist
6. **Test the History button** to verify it navigates correctly

## Integration with Other Features

The profile data can be used throughout the app:

### Daily Read Card
```javascript
// Adjust recommendations based on work hours
const profile = await getProfile(userId);
const isDuringWork = isDuringWorkHours(profile);

if (isDuringWork) {
  dailyRead.microAction = {
    text: "Take a 5-minute walking break",
    action: "quick-break" // Shorter action during work
  };
}
```

### Dashboard Schedule
```javascript
// Filter tasks based on work hours
const profile = await getProfile(userId);
const filteredTasks = tasks.filter(task => {
  const taskTime = parseTaskTime(task);
  return isOutsideWorkHours(taskTime, profile);
});
```

### Push Notifications
```javascript
// Check before sending
const profile = await getProfile(userId);
if (!shouldSendNotification(profile, reminderTime)) {
  console.log("Skipping notification during work hours");
  return;
}
```

## Notes

- All profile data is optional - users can skip any fields
- Work hours use 24-hour format internally (HH:MM:SS)
- Profile picture uploads are limited to 5MB
- The `updated_at` field automatically updates on every profile save
- Email is stored but not currently used (future feature: email notifications)
