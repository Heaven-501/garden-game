const tg = window.Telegram.WebApp;
tg.expand();

// CONFIG
const DAY_POINTS = 1000;
const SECONDS_IN_DAY = 86400;
const POINTS_PER_SECOND = DAY_POINTS / SECONDS_IN_DAY; // ~0.01157

let totalPoints = parseFloat(localStorage.getItem('h_points')) || 0;
let lastMineTime = parseInt(localStorage.getItem('h_last_mine')) || 0;
let miningInterval;

function updateDisplay() {
    document.getElementById('point-balance').innerText = totalPoints.toFixed(3);
    const bigCoins = (totalPoints / 30000).toFixed(4);
    document.getElementById('coin-balance').innerText = `${bigCoins} Big Coins`;
}

function startFarmingVisuals() {
    if (miningInterval) clearInterval(miningInterval);
    miningInterval = setInterval(() => {
        totalPoints += POINTS_PER_SECOND;
        localStorage.setItem('h_points', totalPoints);
        updateDisplay();
    }, 1000); // Updates every second
}

function checkStatus() {
    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000;
    const timePassed = now - lastMineTime;

    if (lastMineTime !== 0 && timePassed < cooldown) {
        // Mining is in progress
        document.getElementById('mine-btn').disabled = true;
        document.getElementById('mine-btn').innerText = "Farming...";
        document.getElementById('timer-container').style.display = 'block';
        startFarmingVisuals();
        updateCountdown(cooldown - timePassed);
    } else {
        // Ready to start
        document.getElementById('mine-btn').disabled = false;
        document.getElementById('mine-btn').innerText = "Start Relaxing";
        document.getElementById('timer-container').style.display = 'none';
        if (miningInterval) clearInterval(miningInterval);
    }
}

function updateCountdown(timeLeft) {
    const timer = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(timer);
            checkStatus();
            return;
        }
        timeLeft -= 1000;
        const h = Math.floor(timeLeft / 3600000);
        const m = Math.floor((timeLeft % 3600000) / 60000);
        const s = Math.floor((timeLeft % 60000) / 1000);
        document.getElementById('countdown').innerText = 
            `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    }, 1000);
}

document.getElementById('mine-btn').addEventListener('click', () => {
    lastMineTime = Date.now();
    localStorage.setItem('h_last_mine', lastMineTime);
    tg.HapticFeedback.impactOccurred('heavy');
    checkStatus();
});

// Fetch TON Price
async function getPrice() {
    try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd');
        const data = await res.json();
        document.getElementById('ton-price').innerText = `$${data['the-open-network'].usd}`;
    } catch (e) { document.getElementById('ton-price').innerText = "$5.50"; }
}

getPrice();
updateDisplay();
checkStatus();
