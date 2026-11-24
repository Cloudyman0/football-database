# Football DB

Eine responsive Fußballspieler-Datenbank mit React, Vite und Supabase.

## Lokal starten
1. Node.js installieren: https://nodejs.org/
2. Im Projektordner `npm install` ausführen.
3. `.env.example` in `.env.local` umbenennen.
4. Supabase Project URL und Publishable Key in `.env.local` eintragen.
5. `npm run dev` starten und die angezeigte lokale Adresse öffnen.

## Online stellen
Das GitHub-Repository mit Vercel verbinden und in Vercel unter Settings → Environment Variables setzen:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Danach deployen.

## Sicherheit
Der Publishable Key darf im Browser verwendet werden. Niemals Secret-/service_role-Keys in diese Website oder in GitHub eintragen.
Die Datenbank muss RLS aktiv haben. Die Schreib-Policies müssen ausschließlich die gewünschte Admin-UID erlauben. Öffentliche Registrierung in Supabase Authentication deaktivieren.
