# Supabase Migrations

## Demo Users Setup

These SQL migrations set up all demo users from `DEMO_CREDENTIALS.md` for registration and login.

## Quick Start

### Step 0: Create Database Schema (if tables don't exist)

The migration `20241221110000_create_schema_tables.sql` will create the required tables automatically. It runs first.

### Step 1: Create Users in Supabase Auth

Go to **Supabase Dashboard** → **Authentication** → **Users** → **Add User**

Create these users (check "Auto Confirm User" for each):

1. **Admin**
   - Email: `admin@datamorphosis.in`
   - Password: `password123`
   - ✅ Auto Confirm User

2. **Customers** (create all 5):
   - `renka@premices.com` / `renka123`
   - `john.smith@example.com` / `john123`
   - `sarah.johnson@example.com` / `sarah123`
   - `michael.chen@example.com` / `michael123`
   - `emily.davis@example.com` / `emily123`
   - ✅ Auto Confirm User (for all)

### Step 2: Run SQL Migration

**Option A: Via Supabase Dashboard**
1. Go to **SQL Editor**
2. Copy contents of `20241221120001_create_all_users_complete.sql`
3. Click **Run**

**Option B: Via Supabase CLI**
```bash
supabase db push
```

## Files

- `20241221120000_create_demo_users.sql` - Uses helper function to set up users
- `20241221120001_create_all_users_complete.sql` - Complete setup (recommended)

## Users Created

### Admin (1)
- `admin@datamorphosis.in` / `password123`

### Customers (5)
- `renka@premices.com` / `renka123`
- `john.smith@example.com` / `john123`
- `sarah.johnson@example.com` / `sarah123`
- `michael.chen@example.com` / `michael123`
- `emily.davis@example.com` / `emily123`

## What Gets Set Up

For each user:
- ✅ Profile in `public.profiles` table
- ✅ Role in `public.user_roles` table
- ✅ Email confirmed in `auth.users`

## Verification

After running migration, verify:
1. **Authentication > Users**: All 6 users exist
2. **Table Editor > profiles**: All 6 profiles exist
3. **Table Editor > user_roles**: 1 admin + 5 customers

## Login Test

Try logging in with any credentials from `DEMO_CREDENTIALS.md`:
- Admin: `/admin` dashboard
- Customers: `/customer` dashboard

