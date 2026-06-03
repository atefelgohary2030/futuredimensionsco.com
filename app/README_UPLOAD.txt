Future Dimensions Client Portal - Mobile V5 Admin Panel

Upload all files inside this folder to your GitHub /app directory.

Recommended URL after upload:
https://www.futuredimensionsco.com/app/?v=4005

What changed in V5:
- Added Admin Panel visible only to approved admin emails.
- Added access request form inside the app.
- Added client profile management from the Admin Panel.
- Added approve/reject request actions.
- Added copy invitation message and send magic-login link helper.
- Updated optional Supabase SQL with access_requests and clients tables + RLS policies.

Important:
- Keep the Supabase Service Role key OUT of the browser.
- To create official Auth users, use Supabase Authentication dashboard or a secure Edge Function.
- Admin email in the app is info@futuredimensionsco.com. The email must exist in Supabase Authentication and have a password or magic link enabled.
