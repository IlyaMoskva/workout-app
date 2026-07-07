# Project45 MVP Usage

Project45 MVP 0.1 is a local-first daily workout app. It opens into **Today** by default so the first action is clear: review today's sessions and mark exercises complete as you train.

Project45 is served as an MVP preview under `/project45/` so the legacy root `index.html` app can remain unchanged.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173/project45/`.

The legacy app remains separate at the repository root `index.html`. Open that file directly, or serve the repository root with any static file server, when you need the original app.

For a production check:

```bash
npm run test:run
npm run build
npm run preview
```

Then open `http://localhost:4173/project45/`.

## Phone Testing On Local LAN

1. Connect the phone and development machine to the same network.
2. Run `npm run dev`.
3. Find the `Network` URL printed by Vite, usually similar to `http://192.168.x.x:5173/`.
4. Open `http://192.168.x.x:5173/project45/` on the phone.
5. Use Today first, then check Week, History, Recovery, GTO, Library, Settings, and Settings -> Export / Import.

## Use The App Today

- **Today**: start here. See today's focus, total duration, full-day progress, session cards, and large exercise completion controls.
- **Week**: review the 7-day seed plan and see day-level completion summaries.
- **History**: review recent local completion history and open day summaries.
- **Recovery**: log daily sleep, energy, soreness, stress, optional libido, and readiness.
- **GTO**: record weekly test results against MVP targets.
- **Library**: browse catalog exercises and filter by goal or equipment.
- **Settings**: choose active goals, available equipment, preferred session slots, and use Export / Import.

## Local Data

All MVP data is stored in this browser's `localStorage`. Project45 does not send workout, recovery, settings, or backup data to a server.

Use **Settings -> Export / Import** to download a JSON backup or restore one. Imports validate the backup schema and known data keys before replacing local data.

## Mobile Use

The app is designed for phone-width use. The top navigation scrolls horizontally when needed, and Today uses large cards and completion controls for one-hand workout use.

## Current Limitations

- The weekly plan is a fixed seed plan, not a generator.
- There is no account system, cloud sync, calendar integration, nutrition tracking, encryption, or onboarding wizard.
- Data is local to the current browser unless exported and imported manually.
- The legacy `index.html` app remains untouched and separate from the React MVP.
