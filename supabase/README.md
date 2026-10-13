# Supabase backend setup

## What this backend does

The `app-api` Edge Function is the only component allowed to read/write request tables with the service-role key. The browser must never receive that key. The `customer-files` bucket is forced to remain private.

Actions implemented: customer request creation, short-lived signed uploads, file registration, request tracking, operator PIN login, operator request list/status changes, signed downloads, and expired-file cleanup.

## Required Edge Function secrets

In Supabase Dashboard → Edge Functions → Secrets, set:

- `OPERATOR_PIN`: a new operator PIN (do not reuse the old demo PIN `1234`).
- `ADMIN_TOKEN_SECRET`: a random secret of at least 32 characters.
- `CLEANUP_SECRET`: a separate random secret used only by the scheduled cleanup job.

Supabase supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions. Never copy the service-role key into `.env.local`, GitHub, or any `VITE_*` variable.

## Deploy

From the repository root, with Supabase CLI installed and authenticated:

```sh
supabase login
supabase link --project-ref xobhecaqgihobropcers
supabase secrets set OPERATOR_PIN="choose-a-new-pin" ADMIN_TOKEN_SECRET="paste-a-random-secret-at-least-32-characters" CLEANUP_SECRET="paste-a-different-random-secret"
supabase db push
supabase functions deploy app-api
```

The function disables the default JWT gateway check because the public customer actions use their own short-lived signed request token and operator actions use a separately signed operator token. Each privileged action is verified inside the function. Do not expose the service-role key to the client.

## Cleanup schedule

Call the deployed function once every 10–15 minutes with a POST JSON body `{"action":"cleanup_expired"}` and header `x-cleanup-secret: <CLEANUP_SECRET>`. Configure this in Supabase Cron/HTTP or another scheduler using secrets; do not put the cleanup secret in frontend code. The function checks `expires_at`, removes objects from Storage, and marks rows as deleted. Downloads are denied as soon as `expires_at` has passed even if physical cleanup has not run yet.

## Important status

This is the secure server foundation, not the complete UI integration. The current React components still use IndexedDB. Do not point production customers at this backend until the UI has been migrated to call `app-api` and signed upload/download flows have been tested. Existing tables must match the fields used by the function (`print_requests.request_data`, `request_files.storage_path`, and the other columns in the migration/function).
