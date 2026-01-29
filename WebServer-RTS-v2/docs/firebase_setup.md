# Firebase Realtime Database Setup

1) Create a Firebase project and enable Realtime Database.
2) Generate a service account key (JSON) from Project Settings -> Service accounts.
3) Place the JSON at `secrets/serviceAccountKey.json`.
4) Set your database URL in configs (e.g. https://<your-db>.firebaseio.com/).
5) Set `rtdb.mode` to `firebase` in your config.

Notes:
- The `secrets/` directory is ignored by git.
- If Firebase is not configured, the system runs in mock mode.
