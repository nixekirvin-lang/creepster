# Creepster - Development Notes

## Live URLs

- **Frontend**: https://creepster-6cf9f.web.app
- **Backend API**: https://creepster.vercel.app

## Setup & Deploy

```bash
npm run install:all    # Install all dependencies
npm run dev            # Start both server and client locally
npm run build          # Build client for production
firebase deploy --only hosting   # Deploy frontend to Firebase
vercel --prod          # Deploy backend to Vercel
```

## Architecture

- **Frontend**: React 18 + Vite (served via Firebase Hosting)
- **Backend**: Express.js on Vercel (serverless)
- **Database**: Cloud Firestore
- **Auth**: JWT-based (custom, stored in Firestore)

## Local Development

```bash
# Terminal 1: Start backend
npm run server

# Terminal 2: Start frontend
npm run client
```

The Vite dev server proxies `/api/*` to `http://127.0.0.1:3001`.

## Key Files

- `server/index.js` - Express server entry point
- `server/firebase.js` - Firebase Admin SDK init
- `server/routes/` - API routes (auth, posts, users, messages, notifications, search)
- `client/src/` - React frontend
- `firebase.json` - Firebase hosting config
- `vercel.json` - Vercel deployment config
- `firestore.rules` - Firestore security rules

## Environment Variables (Vercel)

- `FIREBASE_PROJECT_ID` = `creepster-6cf9f`
- `FIREBASE_SERVICE_ACCOUNT` = (service account JSON)
- `JWT_SECRET` = (auto-generated)

## No Fake Accounts

The app starts empty. Users sign up fresh via the registration form.
