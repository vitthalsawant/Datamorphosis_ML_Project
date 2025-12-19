# Supabase Database Migrations

This directory contains SQL migration files for setting up the Datamorphosis authentication and user management system.

## Migration Files

### 1. `20250114000000_complete_auth_setup.sql` ⭐ **START HERE**
Complete database setup including:
- **Enums**: `app_role`, `camera_status`, `detection_type`
- **Tables**: 
  - `companies` - Company information (all registrations are companies)
  - `profiles` - User profiles linked to auth.users
  - `user_roles` - User role assignments (admin, employee, customer)
  - `activities` - User activity logs
  - `cameras` - Camera management
  - `detection_logs` - Detection event logs
- **Indexes**: Performance indexes on all key columns
- **Triggers**: 
  - Auto-create profile and customer role on signup
  - Auto-update `updated_at` timestamps
- **Functions**: All helper functions for registration, admin operations, and role checking
- **RLS Policies**: Complete Row Level Security setup for all tables

### 2. `20250114000001_create_admin_user.sql`
Admin user setup helper:
- `setup_admin_user(user_id)` - Setup admin role and profile after user creation
- Instructions for creating admin user via Supabase Dashboard

## Quick Start

### Step 1: Apply Main Migration
Run `20250114000000_complete_auth_setup.sql` via:
- **Supabase Dashboard SQL Editor** (easiest)
- **Supabase CLI**: `npx supabase db push`
- **PowerShell Script**: `.\push-migrations.ps1`

### Step 2: Create Admin User
Follow instructions in `../SETUP_ADMIN_USER.md`:
1. Create admin user via Supabase Dashboard (admin@datamorphosis.in / password123)
2. Run admin setup SQL to assign role and create profile

### Step 3: Verify Setup
See `../APPLY_MIGRATIONS.md` for verification queries and troubleshooting.

## How to Apply Migrations

### Option 1: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push
```

### Option 2: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste each migration file content in order
4. Execute each migration sequentially

### Option 3: Using psql

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run migrations in order
\i 20250101000000_create_auth_schema.sql
\i 20250101000001_create_auth_functions.sql
\i 20250101000002_create_rls_policies.sql
\i 20250101000003_create_admin_user.sql
```

## Database Flow

### User Registration Flow:
1. User signs up via Supabase Auth → `auth.users` table
2. Trigger `on_auth_user_created` fires automatically
3. Profile created in `profiles` table with `is_approved = false`
4. Customer role assigned in `user_roles` table
5. User redirected to customer dashboard

### Admin Dashboard Flow:
1. Admin logs in (hardcoded credentials or Supabase admin)
2. Admin queries `profiles` table filtered by `user_roles.role = 'customer'`
3. All registered customers displayed
4. Admin can approve/unapprove customers

### Customer Dashboard Flow:
1. Customer logs in via Supabase Auth
2. Profile and role fetched from database
3. If `is_approved = true`, access granted
4. Customer redirected to `/customer` dashboard

## Important Notes

1. **Admin User Creation**: 
   - Admin users should be created manually through Supabase Auth dashboard
   - Then use `assign_admin_role(user_id)` function to assign admin role
   - Or manually insert into `user_roles` table

2. **Customer Approval**:
   - New customers have `is_approved = false` by default
   - Admin must approve customers before they can fully access the system
   - Approval status checked via `is_user_approved()` function

3. **Row Level Security**:
   - All tables have RLS enabled
   - Policies ensure users can only access their own data
   - Admins have elevated permissions

4. **Auto Profile Creation**:
   - Profile is automatically created when user signs up
   - Customer role is automatically assigned
   - No manual intervention needed for customer registration

## Troubleshooting

### If migrations fail:
1. Check if tables already exist (use `DROP TABLE IF EXISTS` if needed)
2. Ensure you have proper permissions
3. Check Supabase logs for detailed error messages

### If RLS policies block access:
1. Verify user is authenticated: `auth.uid()` returns user ID
2. Check user role exists in `user_roles` table
3. Verify policies match your access requirements

### If profile not created on signup:
1. Check trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created'`
2. Verify function exists: `SELECT * FROM pg_proc WHERE proname = 'handle_new_user'`
3. Check Supabase logs for trigger execution errors

## Testing

After applying migrations, test the flow:

1. **Register a new customer**:
   ```sql
   -- This will be done automatically via Supabase Auth
   -- Check if profile was created:
   SELECT * FROM profiles ORDER BY created_at DESC LIMIT 1;
   ```

2. **Check user role**:
   ```sql
   SELECT * FROM user_roles WHERE user_id = 'your-user-id';
   ```

3. **Get all customers (as admin)**:
   ```sql
   SELECT * FROM get_all_customers();
   ```

4. **Approve a customer**:
   ```sql
   UPDATE profiles SET is_approved = true WHERE user_id = 'customer-user-id';
   ```
