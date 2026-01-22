let points = parseInt(localStorage.getItem('heavenPoints')) || 0;
let lastMine = localStorage.getItem('lastMineTime') || 0;

// Update UI on load
document.getElementById('points').innerText = points;

async function fetchPrices() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd');
        const data = await response.json();
        const tonPrice = data['the-open-network'].usd;
        document.getElementById('tonPrice').innerText = `$${tonPrice}`;
        // Set Heaven Value: 30k points = 1 Big Coin. Let's say 1 Big Coin = 5 TON
        document.getElementById('heavenVal').innerText = "0.0001 TON / point";
    } catch (e) { console.log("Price fetch failed"); }
}

function mine() {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    if (now - lastMine >= oneDay) {
        points += 1000;
        lastMine = now;
        
        localStorage.setItem('heavenPoints', points);
        localStorage.setItem('lastMineTime', lastMine);
        
        document.getElementById('points').innerText = points;
        checkButtonState();
        alert("Relaxation complete! +1000 Points.");
    }
}

function checkButtonState() {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const btn = document.getElementById('relaxBtn');
    
    if (now - lastMine < oneDay) {
        btn.disabled = true;
        const remaining = oneDay - (now - lastMine);
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        document.getElementById('timer').innerText = `Next relax in ${hours}h`;
    }
}

fetchPrices();
checkButtonState();

