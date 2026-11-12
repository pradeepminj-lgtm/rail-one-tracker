# Rail One Tracker

A responsive web app/PWA starter that can also be packaged as an Android app with Capacitor.

## Included in this first build

- Responsive Rail One Tracker interface
- Live train running-status lookup
- Server-side API proxy (keeps the provider API key out of the browser)
- PWA manifest, service worker and app icon
- Capacitor Android wrapper configuration
- API routes prepared for train details, trains between stations and station boards

**Important:** this project is a working starter, not a published production app. Live railway information will work only after you add a valid API key and deploy the backend. This app is independent and is not affiliated with Indian Railways, CRIS or IRCTC.

## Live data connection

This starter uses the documented RailRadar API:
- API documentation: https://railradar.in/docs
- Developer dashboard / API key: https://railradar.in/developers
- Live status endpoint: `GET /v1/trains/{number}/live`
- Train details endpoint: `GET /v1/trains/{number}`

RailRadar currently documents a free tier of 50 requests/day. Check the provider's current terms, limits, accuracy/freshness notes and pricing before public launch. It is a third-party provider, not an official Indian Railways API.

1. Create an account at https://railradar.in/developers and generate an API key.
2. Copy `.env.example` to `.env`.
3. Put the key in `RAILRADAR_API_KEY` in `.env`. Never put this secret in frontend JavaScript or commit `.env`.
4. Install and run:

```bash
npm install
npm start
```

5. Open http://localhost:3000.

If the key is missing, the app will clearly show that live data is not connected; it will not invent train positions.

## Android build

Install Node.js LTS and Android Studio first.

```bash
npm install
npx cap add android
```

Deploy the Node backend to a secure HTTPS host. Set `window.RAIL_API_BASE` in `public/config.js` to that backend URL, for example:

```js
window.RAIL_API_BASE = "https://your-api-domain.example";
```

Then run:

```bash
npx cap sync android
npx cap open android
```

Use Android Studio to build and test the APK/AAB. Do not ship an Android app pointing at a developer laptop or a local-only server.

## Backend API routes

- `GET /api/health`
- `GET /api/trains/:number/live`
- `GET /api/trains/:number`
- `GET /api/trains/between/:from/:to`
- `GET /api/stations/:code/trains`

## Before public release

- Confirm the railway-data provider's commercial redistribution and caching terms.
- Add PNR only through a provider that explicitly supports it and permits your intended use.
- Add privacy policy, terms, support contact, crash reporting and security review.
- Add monitoring, API quotas, caching and abuse protection.
- Test on physical Android devices and multiple browsers.
- Do not represent provider data as official railway telemetry unless you have authorization to do so.
