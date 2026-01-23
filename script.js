const tg = window.Telegram.WebApp;
tg.expand();

// ===== SAFE USER IDENTIFIER (HASHED) =====
async function hashId(id) {
  const data = new TextEncoder().encode(String(id));
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)]
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

let USER_HASH = "guest";

// ===== STATE =====
let totalFragments = parseFloat(localStorage.getItem("h_fragments")) || 0;
let miningStart = parseInt(localStorage.getItem("h_mining_start")) || 0;

// ===== INIT =====
(async function init() {
  if (tg.initDataUnsafe?.user?.id) {
    USER_HASH = await hashId(tg.initDataUnsafe.user.id);
  }
  updateDisplay();
  updateMiningState();
  fetchTonPrice();
})();

// ===== MINING LOGIC =====
function minedFragments() {
  if (!miningStart) return 0;

  const elapsed = Math.min(
    Date.now() - miningStart,
    MINING_DURATION
  );

  return (elapsed / 1000) * FRAGMENTS_PER_SECOND;
}

function updateDisplay() {
  const earned = minedFragments();
  const total = totalFragments + earned;

  document.getElementById("fragment-balance").innerText =
    total.toFixed(3);

  document.getElementById("heaven-balance").innerText =
    `${Math.floor(total / 30000)} Heaven Coins`;
}

function updateMiningState() {
  const btn = document.getElementById("mine-btn");
  const timerBox = document.getElementById("timer-container");

  if (miningStart && Date.now() - miningStart < MINING_DURATION) {
    btn.disabled = true;
    btn.innerText = "Mining…";
    timerBox.style.display = "block";
    startCountdown();
  } else {
    if (miningStart) {
      totalFragments += minedFragments();
      localStorage.setItem(
        "h_fragments",
        totalFragments.toString()
      );
      miningStart = 0;
      localStorage.removeItem("h_mining_start");
    }

    btn.disabled = false;
    btn.innerText = "Start Mining";
    timerBox.style.display = "none";
    updateDisplay();
  }
}

function startCountdown() {
  const countdownEl = document.getElementById("countdown");

  const interval = setInterval(() => {
    if (!miningStart) {
      clearInterval(interval);
      return;
    }

    const remaining =
      MINING_DURATION - (Date.now() - miningStart);

    if (remaining <= 0) {
      clearInterval(interval);
      updateMiningState();
      return;
    }

    const h = Math.floor(remaining / 3600000);
    const m = Math.floor((remaining % 3600000) / 60000);
    const s = Math.floor((remaining % 60000) / 1000);

    countdownEl.innerText =
      `${h.toString().padStart(2, "0")}:` +
      `${m.toString().padStart(2, "0")}:` +
      `${s.toString().padStart(2, "0")}`;
  }, 1000);
}

document.getElementById("mine-btn").addEventListener("click", () => {
  console.log("Start Mining clicked"); // debug
  miningStart = Date.now();
  localStorage.setItem(
    "h_mining_start",
    miningStart.toString()
  );
  if (tg.HapticFeedback?.impactOccurred) tg.HapticFeedback.impactOccurred("medium");
  updateMiningState();
});

// ===== LIVE UI TICK =====
setInterval(() => {
  updateDisplay();
}, 1000);

// ===== TON PRICE FETCH WITH ERROR HANDLING =====
async function fetchTonPrice() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd"
    );
    if (!res.ok) throw new Error("HTTP error " + res.status);
    const data = await res.json();
    console.log("TON price raw data:", data); // debug
    document.getElementById("ton-price").innerText =
      `$${data["the-open-network"].usd}`;
  } catch (err) {
    console.error("Failed to fetch TON price:", err);
    document.getElementById("ton-price").innerText = "$—";
  }
}
