# Google Play Release

## Production backend

The production Android build should use:

- `https://shekinah-sons-backend.onrender.com`
- Privacy policy URL after backend deploy: `https://shekinah-sons-backend.onrender.com/privacy-policy`

Sync local Docker content to Render before publishing:

```bash
cd /home/ariga/Desktop/my-church-app/MyChurch
docker compose up -d postgres api
npm run sync:render
```

## Build profiles

- `preview`: internal testing APK
- `production`: Google Play bundle (`.aab`)

Build for Google Play with EAS:

```bash
cd /home/ariga/Desktop/my-church-app/MyChurch
eas build -p android --profile production
```

## Before upload

1. Verify Render health:

```bash
curl -sS https://shekinah-sons-backend.onrender.com/health
```

2. Verify live content:

```bash
curl -sS https://shekinah-sons-backend.onrender.com/api/app/home
```

3. Confirm the app is targeting API 35+.
4. Upload the `.aab`, not an `.apk`.

## Play Console checklist

1. Create the app in Play Console.
2. Upload the `production` `.aab` to internal testing first.
3. Complete the store listing:
   - app name
   - short description
   - full description
   - app icon
   - feature graphic
   - screenshots
4. Complete App content forms:
   - privacy policy
   - data safety
   - ads declaration
   - app access, if requested
   - content rating
   - target audience
5. Review Android vitals and pre-launch report.
6. Promote from internal testing to closed/open/production after validation.

## Data safety guidance

Review this carefully in Play Console against the actual release behavior. The app currently supports or stores:

- account name
- email address
- authentication token
- prayer requests and comments entered by users
- testimonies entered by users
- reading/devotion progress
- donation history linked to the user account

If a field is not being collected in the released build, do not declare it as collected.

## Known post-release follow-up

Google sign-in is intentionally disabled for the first Play release. After the first upload:

1. Get the Play app signing SHA-1 from Play Console.
2. Add a matching Android OAuth client in Google Cloud.
3. Add that client ID to:
   - app build env
   - backend `GOOGLE_CLIENT_IDS`
4. Set `EXPO_PUBLIC_ENABLE_GOOGLE_SIGN_IN=true` for the next release.
