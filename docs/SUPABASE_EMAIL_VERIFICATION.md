# Supabase Email Verification Setup

This document explains how the email verification flow works in Azmuth and how
to configure it properly.

## Overview

When a user signs up, Supabase sends a confirmation email with a verification
link. The user clicks this link and is redirected to the app. This setup
ensures:

1. **Proper redirect URL** - Users are redirected to `/auth/confirm` instead of
   an unknown URL
2. **Success/Error handling** - Users see clear feedback about their
   verification status
3. **Clear call-to-action** - After verification, users are guided to login

## Files Modified

### 1. `src/app/auth/signup/page.tsx`

Added `emailRedirectTo` option to the Supabase signUp call:

```typescript
const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
        data: { name },
        emailRedirectTo: `${baseUrl}/auth/confirm`,
    },
});
```

### 2. `src/app/auth/confirm/page.tsx` (NEW)

Created a new page that handles the email confirmation redirect. This page:

- Checks for token/hash in URL parameters
- Processes Supabase confirmation tokens from URL hash fragments
- Displays appropriate success/error messages
- Provides clear call-to-action buttons

## How It Works

### Signup Flow

1. User fills out signup form at `/auth/signup`
2. User submits the form
3. Supabase sends confirmation email with link to `/auth/confirm?hash=xxx`
4. User sees "Check your email" message

### Email Confirmation Flow

1. User clicks confirmation link in email
2. User is redirected to `/auth/confirm`
3. The page:
   - Checks for verification token in URL parameters or hash fragment
   - Verifies the token with Supabase
   - Shows success message if verified
   - Shows error message if failed/expired

### Post-Verification

1. Success: User sees "Email Verified Successfully!" with:
   - "Login Now" button → redirects to `/auth/login?verified=true`
   - "Explore Features" button → redirects to homepage

2. Error: User sees "Verification Failed" with:
   - "Go to Homepage" button
   - "Go to Login" button

## Supabase Dashboard Configuration

For this to work properly, you need to configure your Supabase project:

### 1. Site URL

Go to **Authentication → URL Configuration** in Supabase dashboard:

- **Site URL**: Set to your production URL (e.g., `https://your-app.com`)
- **Redirect URLs**: Add your development and production URLs:
  - `http://localhost:3000/auth/confirm`
  - `https://your-app.com/auth/confirm`

### 2. Email Templates

You can customize the email template in **Authentication → Email Templates**:

- The `{{ .ConfirmationURL }}` variable contains the full confirmation link
- This link will automatically include the redirect URL parameter

### 3. Environment Variables

Make sure your `.env.local` has:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For production, update `NEXT_PUBLIC_APP_URL` to your production URL.

## Development vs Production

### Development (localhost)

The signup will redirect to:

```
http://localhost:3000/auth/confirm?hash=xxx
```

### Production

The signup will redirect to:

```
https://your-app.com/auth/confirm?hash=xxx
```

## Troubleshooting

### Issue: "Invalid verification link"

**Cause**: The token is missing or malformed in the URL.

**Solution**:

1. Check that `NEXT_PUBLIC_APP_URL` is set correctly in `.env.local`
2. Verify the redirect URL is added in Supabase dashboard

### Issue: Email not received

**Cause**: Email might be in spam or not sent.

**Solution**:

1. Check Supabase dashboard → Authentication → Logs
2. Verify the email template is configured
3. For development, you can use Supabase's "Confirm email" manually in the
   dashboard

### Issue: Redirects to unknown URL

**Cause**: `emailRedirectTo` not configured in signup call.

**Solution**:

1. Ensure `emailRedirectTo` is set in signup options
2. The URL must be added to "Redirect URLs" in Supabase dashboard

## References

- [Supabase Auth - Email Links](https://supabase.com/docs/guides/auth/auth-email-passwordless)
- [Supabase Auth - Configuration](https://supabase.com/docs/guides/auth/auth-url-configuration)
- [Next.js Supabase Example](https://github.com/supabase-community/nextjs-supabase-auth)
