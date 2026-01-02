# Deprecated Mongoose Models

These MongoDB/Mongoose model files have been deprecated as part of the Supabase migration.

**DO NOT USE THESE FILES**

The application now uses:
- Supabase PostgreSQL database
- Direct Supabase client queries
- Schema defined in `backend/supabase/schema.sql`

These files are kept for reference only and will be removed in a future cleanup.

## Migration Date
December 31, 2025

## Replacement
All models are now represented as PostgreSQL tables in Supabase.
See `backend/supabase/schema.sql` for the current schema.
