import { initializeApp, getApps, getApp } from "firebase/app";

const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyDvbYeHkySBuGB4wZQzJUSQblU_O3uW6IU",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "trading-fdee2.firebaseapp.com",
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "trading-fdee2",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "trading-fdee2.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    "765551311020",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    "1:765551311020:web:c5628ac6a3f92ea4d8c709",
};

export const app = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();
