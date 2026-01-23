// ===== FIREBASE CONFIGURATION =====
// PASTE YOUR KEYS FROM FIREBASE CONSOLE HERE
const firebaseConfig = {
    apiKey: "AIzaSyCqddUvbIY8DUKWEQgftgz_cPxW1KjPpAo",          // <--- PASTE YOUR API KEY
    authDomain: "heaven-coin-app.firebaseapp.com",
    projectId: "heaven-coin-app",
    storageBucket: "heaven-coin-app.firebasestorage.app",
    messagingSenderId: "481134092657",
    appId: "1:481134092657:web:98eccf38cd8d722c6216d0"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ===== GAME CONFIG =====
const BITS_TO_HC = 30000;  // 30k Bits = 1 HC
const DAILY_BITS = 1000;
const SECONDS_IN_DAY = 86400;
const BITS_PER_SECOND = DAILY_BITS / SECONDS_IN_DAY; 

// Exchange Items
const EXCHANGE_ITEMS = [
    { id: 1, name: "Mystic Aura", cost: 2000, type: "bits", icon: "✨", desc: "Just a shiny cosmetic." },
    { id: 2, name: "Double Speed", cost: 5, type: "hc", icon: "⚡", desc: "Mine 2x faster (24h)." }
];

// Wheel Rewards (Degrees and Values)
const WHEEL_SEGMENTS = [
    { deg: 30, val: 50 },
    { deg: 90, val: 100 },
    { deg: 150, val: 200 },
    { deg: 210, val: 500 },
    { deg: 270, val: 1000 },
    { deg: 330, val: 0 } // Try Again
];
