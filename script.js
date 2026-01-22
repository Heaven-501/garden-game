// Initialize Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand(); // Expands the app to full height

// --- CONFIGURATION ---
const COINS_TO_BIG_COIN = 30000; // 30 days * 1000
const MINE_AMOUNT = 1000;
const COOLDOWN_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// --- STATE MANAGEMENT ---
// We use localStorage to save data on the user's phone for now
let points = parseInt(localStorage.getItem('heaven_points')) || 0;
let lastMineTime = parseInt(localStorage.getItem('last_mine_time')) || 0;

// Elements
const pointEl = document.getElementById('point-balance');
const coinEl = document.getElementById('coin-balance');
const mineBtn = document.getElementById('mine-btn');
const timerEl = document.getElementById('timer');
const tonPriceEl = document.getElementById('ton-price');

// --- FUNCTIONS ---

function updateUI() {
    // Update Points
    pointEl.innerText = points.toLocaleString();
    
    // Calculate Big Coins (Heaven Coins)
    const bigCoins = (points / COINS_TO_BIG_COIN).toFixed(2);
    coinEl.innerText = `≈ ${bigCoins} Big Coins`;
}

function checkMineStatus() {
    const now = Date.now();
    const timePassed = now - lastMineTime;

    if (timePassed >= COOLDOWN_TIME) {
        // Ready to mine
        mineBtn.disabled = false;
        mineBtn.innerText = "Press & Relax";
        timerEl.innerText = "Your daily harvest is ready.";
    } else {
        // Still cooling down
        mineBtn.disabled = true;
        const timeLeft = COOLDOWN_TIME - timePassed;
        
        // Convert to hours and minutes
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        
        mineBtn.innerText = "Relaxing...";
        timerEl.innerText = `Next harvest in: ${hours}h ${minutes}m`;
    }
}

function mine() {
    // Add points
    points += MINE_AMOUNT;
    lastMineTime = Date.now();

    // Save to storage
    localStorage.setItem('heaven_points', points);
    localStorage.setItem('last_mine_time', lastMineTime);

    // Vibration feedback (Haptic)
    if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('medium');
    }

    // Update UI
    updateUI();
    checkMineStatus();
    
    // Optional: Show a popup
    tg.showPopup({
        title: 'Relaxation Complete',
        message: `You've collected ${MINE_AMOUNT} Heaven Points! Come back tomorrow.`,
        buttons: [{type: 'ok'}]
    });
}

async function fetchTonPrice() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd');
        const data = await response.json();
        const price = data['the-open-network'].usd;
        tonPriceEl.innerText = `$${price}`;
    } catch (error) {
        console.error("Error fetching price:", error);
        tonPriceEl.innerText = "Error";
    }
}

// --- INITIALIZATION ---
mineBtn.addEventListener('click', mine);

// Run on startup
updateUI();
checkMineStatus();
fetchTonPrice();

// Update timer every minute so the countdown moves
setInterval(checkMineStatus, 60000);
