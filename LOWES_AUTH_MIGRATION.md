# Lowe's Authentication Migration Guide

This guide explains how to migrate Lowe's team member authentication from localStorage to Supabase.

## Migration Steps

### 1. Install bcryptjs

```bash
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

### 2. Run Database Migration

Run the SQL migration in Supabase SQL Editor:
- `database/lowes-auth-migration.sql` - Creates `lowes_team_members` table

### 3. Migrate Existing Users (Optional Script)

If you have existing users in localStorage, you'll need to:
1. Export users from localStorage
2. Hash their passwords using bcryptjs
3. Insert them into `lowes_team_members` table

### 4. Update Frontend

The frontend will now:
- **Signup**: Call `/api/lowes-team-members` (POST) - password is hashed server-side
- **Login**: Call `/api/lowes-auth/login` (POST) - password is verified server-side
- **Session**: Store only user data (not password) in localStorage

### 5. Update API Endpoints

- ✅ `POST /api/lowes-team-members` - Now hashes passwords with bcrypt before storing
- ✅ `POST /api/lowes-auth/login` - Verifies passwords with bcrypt

## Security Improvements

1. **Passwords are hashed** using bcrypt (bcryptjs) before storage
2. **Passwords are never stored in localStorage** - only user session data
3. **Password verification happens server-side** - cannot be bypassed
4. **Database-backed authentication** - centralized and secure

## Backward Compatibility

The system supports both:
- **New users**: Stored in `lowes_team_members` table with hashed passwords
- **Old users**: Can still login if they exist in placeholder conversations (during migration period)

## Rollout Plan

1. Run database migration
2. Deploy updated API endpoints (with password hashing)
3. Update frontend login/signup pages
4. Test new signup flow
5. Test new login flow
6. Migrate existing users (if any)
