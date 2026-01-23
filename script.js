const tg = window.Telegram.WebApp;
tg.expand();

// Global State
let totalFragments = parseFloat(localStorage.getItem("h_fragments")) || 0;
let miningStart = parseInt(localStorage.getItem("h_mining_start")) || 0;
let lastSpin = parseInt(localStorage.getItem("h_last_spin")) || 0;
let totalSpins = parseInt(localStorage.getItem("h_total_spins")) || 0;

// Initialize
(async function init() {
  updateDisplay();
  updateMiningState();
  fetchTonPrice();
  loadExchange();
  loadLeaderboard();
  checkSpinStatus();
  document.getElementById("user-hash-display").innerText = "ID: " + (tg.initDataUnsafe?.user?.id || "Guest");
})();

// TAB NAVIGATION
function switchTab(tab) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-bar button').forEach(b => b.classList.remove('active'));
  
  document.getElementById(`tab-${tab}`).classList.add('active');
  document.getElementById(`nav-${tab}`).classList.add('active');
  if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred("light");
}

// MODAL CONTROL
function toggleModal(id) {
  const modal = document.getElementById(id);
  modal.style.display = (modal.style.display === "block") ? "none" : "block";
}

// MINING LOGIC
function minedFragments() {
  if (!miningStart) return 0;
  const elapsed = Math.min(Date.now() - miningStart, MINING_DURATION);
  return (elapsed / 1000) * FRAGMENTS_PER_SECOND;
}

function updateDisplay() {
  const earned = minedFragments();
  const currentTotal = totalFragments + earned;
  const hcCount = Math.floor(currentTotal / 30000);

  document.getElementById("fragment-balance").innerText = currentTotal.toFixed(3);
  document.getElementById("heaven-balance").innerText = `${hcCount} Heaven Coins`;
  
  // Update Top Bar
  document.getElementById("header-fragments").innerText = Math.floor(currentTotal);
  document.getElementById("header-coins").innerText = hcCount;
  
  // Update Stats
  document.getElementById("stat-total").innerText = Math.floor(currentTotal);
  document.getElementById("stat-spins").innerText = totalSpins;
}

document.getElementById("mine-btn").addEventListener("click", () => {
  miningStart = Date.now();
  localStorage.setItem("h_mining_start", miningStart.toString());
  updateMiningState();
});

function updateMiningState() {
  const btn = document.getElementById("mine-btn");
  const timerBox = document.getElementById("timer-container");

  if (miningStart && Date.now() - miningStart < MINING_DURATION) {
    btn.disabled = true;
    btn.innerText = "Mining...";
    timerBox.style.display = "block";
    startCountdown();
  } else {
    if (miningStart) {
      totalFragments += minedFragments();
      localStorage.setItem("h_fragments", totalFragments.toString());
      miningStart = 0;
      localStorage.removeItem("h_mining_start");
    }
    btn.disabled = false;
    btn.innerText = "Start Mining";
    timerBox.style.display = "none";
  }
}

function startCountdown() {
  const countdownEl = document.getElementById("countdown");
  const interval = setInterval(() => {
    if (!miningStart) { clearInterval(interval); return; }
    const remaining = MINING_DURATION - (Date.now() - miningStart);
    if (remaining <= 0) { clearInterval(interval); updateMiningState(); return; }
    const h = Math.floor(remaining / 3600000);
    const m = Math.floor((remaining % 3600000) / 60000);
    const s = Math.floor((remaining % 60000) / 1000);
    countdownEl.innerText = `${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
  }, 1000);
}

// SPIN LOGIC
function checkSpinStatus() {
  const now = Date.now();
  const btn = document.getElementById("spin-btn");
  if (now - lastSpin < 86400000) {
    btn.disabled = true;
    const remaining = 86400000 - (now - lastSpin);
    document.getElementById("spin-timer").innerText = "Next spin in " + Math.floor(remaining / 3600000) + "h";
  } else {
    btn.disabled = false;
    document.getElementById("spin-timer").innerText = "Ready to spin!";
  }
}

function handleSpin() {
  const wheel = document.getElementById("wheel");
  wheel.style.transition = "transform 3s cubic-bezier(0.15, 0, 0.15, 1)";
  const rotation = 1800 + Math.random() * 360; 
  wheel.style.transform = `rotate(${rotation}deg)`;

  setTimeout(() => {
    const reward = Math.floor(Math.random() * 500) + 100;
    totalFragments += reward;
    lastSpin = Date.now();
    totalSpins++;
    localStorage.setItem("h_fragments", totalFragments);
    localStorage.setItem("h_last_spin", lastSpin);
    localStorage.setItem("h_total_spins", totalSpins);
    alert(`You won ${reward} Fragments!`);
    checkSpinStatus();
    updateDisplay();
  }, 3500);
}

// EXCHANGE LOGIC
function loadExchange() {
  const container = document.getElementById("exchange-list");
  container.innerHTML = EXCHANGE_ITEMS.map(item => `
    <div class="exchange-item">
      <div class="item-img">${item.img}</div>
      <div class="item-info">
        <b>${item.title}</b><br><small>${item.desc}</small>
      </div>
      <button onclick="buyItem(${item.id})">${item.price} ${item.currency}</button>
    </div>
  `).join('');
}

function buyItem(id) {
  const item = EXCHANGE_ITEMS.find(i => i.id === id);
  const total = totalFragments + minedFragments();
  const hcCount = Math.floor(total / 30000);

  if (item.currency === "HC" && hcCount >= item.price) {
    totalFragments -= (item.price * 30000);
    alert("Purchase successful!");
  } else if (item.currency === "Fragments" && total >= item.price) {
    totalFragments -= item.price;
    alert("Purchase successful!");
  } else {
    alert("Not enough balance!");
  }
  localStorage.setItem("h_fragments", totalFragments);
  updateDisplay();
}

function loadLeaderboard() {
  const list = document.getElementById("leaderboard-list");
  list.innerHTML = MOCK_LEADERBOARD.map((u, i) => `<li>#${i+1} ${u.name} - ${u.coins} HC</li>`).join('');
}

async function fetchTonPrice() {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd");
    const data = await res.json();
    document.getElementById("ton-price").innerText = `$${data['the-open-network'].usd}`;
  } catch (e) { document.getElementById("ton-price").innerText = "$5.50"; }
}

setInterval(updateDisplay, 1000);
