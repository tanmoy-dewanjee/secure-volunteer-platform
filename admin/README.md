# Admin Portal

Separate app from the student portal.

- Student: http://localhost:3000
- Admin: http://localhost:3010/login

```bash
cd admin
npm install
npm run dev
```

Demo accounts: `rotaract.admin`, `super.admin`, `viewer.admin`  
Password: `Coordinator1!`  
First sign-in shows a QR code to enrol an authenticator app. Later sign-ins need the current 6-digit app code.

Student IDs such as `a1234567` are rejected.

## Maps

On **When & where**, search a venue (OpenStreetMap). If search cannot find it:

- Pin the selected campus
- Save a written meeting point without a pin
- Enter latitude and longitude

The event can be published in all three cases.

## Supabase

See `supabase/README.md`. After keys are in `admin/.env.local`, open Settings and push the catalogue so the student portal reads the same events.
