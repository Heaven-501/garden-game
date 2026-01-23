// ===== CONFIGURATION =====
const DAY_FRAGMENTS = 1000;
const SECONDS_IN_DAY = 86400;
const FRAGMENTS_PER_SECOND = DAY_FRAGMENTS / SECONDS_IN_DAY;
const MINING_DURATION = 24 * 60 * 60 * 1000; 

// Exchange Items
const EXCHANGE_ITEMS = [
  { id: 1, title: "Telegram Premium (1m)", price: 10, currency: "HC", img: "⭐", desc: "Get 1 month of Telegram Premium." },
  { id: 2, title: "Mystery Box", price: 5000, currency: "Fragments", img: "🎁", desc: "Contains 500-2000 fragments." },
  { id: 3, title: "Speed Booster", price: 2, currency: "HC", img: "⚡", desc: "Mine 1.5x faster for 24 hours." }
];

// Mock Leaderboard
const MOCK_LEADERBOARD = [
  { name: "SkyWalker", coins: 45 },
  { name: "CloudNine", coins: 32 },
  { name: "ZenMaster", coins: 28 },
  { name: "Angel_HC", coins: 15 },
  { name: "CryptoDev", coins: 12 }
];
