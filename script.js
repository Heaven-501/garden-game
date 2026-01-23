const tg = window.Telegram.WebApp;
tg.expand();
tg.enableClosingConfirmation();

// --- AUTHENTICATION & USER DATA ---
// We get the user ID directly from Telegram
const user = tg.initDataUnsafe.user || { 
    id: "test_user_123", 
    first_name: "Test", 
    username: "Tester", 
    photo_url: "https://ui-avatars.com/api/?name=T" 
};

// Current State
let userData = {
    bits: 0,
    hc: 0,
    miningStart: 0,
    lastSpin: 0
};

// --- DATABASE FUNCTIONS ---

// 1. Load or Create User
async function syncUser() {
    const userRef = db.collection('users').doc(String(user.id));
    const doc = await userRef.get();

    if (doc.exists) {
        // User exists, load data
        const data = doc.data();
        userData.bits = data.bits || 0;
        userData.hc = data.hc || 0;
        userData.miningStart = data.miningStart || 0;
        userData.lastSpin = data.lastSpin || 0;
    } else {
        // New user, create profile
        await userRef.set({
            username: user.username || user.first_name,
            photo: user.photo_url || "",
            bits: 0,
            hc: 0,
            miningStart: 0,
            lastSpin: 0,
            joined: firebase.firestore.FieldValue.serverTimestamp()
        });
    }
    updateUI();
    updateProfileUI();
}

// 2. Save Progress (Call this when mining stops or spin finishes)
function saveProgress() {
    db.collection('users').doc(String(user.id)).update({
        bits: userData.bits,
        hc: userData.hc,
        miningStart: userData.miningStart,
        lastSpin: userData.lastSpin,
        username: user.username || user.first_name // Update name if changed
    });
}

// 3. Load Leaderboard
async function loadLeaderboard() {
    const list = document.getElementById('leaderboard-list');
    list.innerHTML = "Loading...";
    
    try {
        const snapshot = await db.collection('users')
            .orderBy('hc', 'desc')
            .limit(10)
            .get();

        list.innerHTML = "";
        let rank = 1;
        snapshot.forEach(doc => {
            const u = doc.data();
            const row = document.createElement('div');
            row.className = 'leaderboard-row';
            row.innerHTML = `
                <span>#${rank} ${u.username}</span>
                <span>${u.hc.toFixed(2)} 🌀</span>
            `;
            list.appendChild(row);
            rank++;
        });
    } catch (e) {
        list.innerText = "Leaderboard requires Firestore Rules setup.";
    }
}

// --- MINING LOGIC ---
function updateUI() {
    // Calculate live bits from mining
    let pendingBits = 0;
    if (userData.miningStart !== 0) {
        const elapsed = (Date.now() - userData.miningStart) / 1000;
        if (elapsed < SECONDS_IN_DAY) {
            pendingBits = elapsed * BITS_PER_SECOND;
        }
    }
    
    const totalDisplay = userData.bits + pendingBits;
    
    // Convert to HC (Visual only, conversion happens in Exchange or auto)
    // Here we just show the balance, real conversion logic can be added later
    
    document.getElementById('bits-balance').innerText = Math.floor(totalDisplay).toLocaleString();
    document.getElementById('hc-balance').innerText = userData.hc.toFixed(2) + " HC";
    
    // Headers
    document.getElementById('header-bits').innerText = Math.floor(totalDisplay);
    document.getElementById('header-hc').innerText = userData.hc.toFixed(1);
}

document.getElementById('mine-btn').addEventListener('click', () => {
    // If not mining, start
    if (userData.miningStart === 0 || Date.now() - userData.miningStart > SECONDS_IN_DAY * 1000) {
        userData.miningStart = Date.now();
        saveProgress();
        checkMiningState();
        tg.HapticFeedback.impactOccurred('medium');
    } else {
        // Collect Button Logic could go here
        alert("Mining in progress...");
    }
});

function checkMiningState() {
    const btn = document.getElementById('mine-btn');
    const timerBox = document.getElementById('timer-container');
    const now = Date.now();
    const elapsed = now - userData.miningStart;

    if (userData.miningStart !== 0 && elapsed < SECONDS_IN_DAY * 1000) {
        btn.disabled = true;
        btn.innerText = "Mining Active...";
        timerBox.style.display = 'block';
        
        // Countdown
        const left = (SECONDS_IN_DAY * 1000) - elapsed;
        const h = Math.floor(left / 3600000);
        const m = Math.floor((left % 3600000) / 60000);
        document.getElementById('countdown').innerText = `${h}h ${m}m`;
    } else {
        // Mining Finished
        if (userData.miningStart !== 0) {
            // Claim the bits
            userData.bits += DAILY_BITS;
            userData.miningStart = 0;
            saveProgress();
            tg.showPopup({message: `You collected ${DAILY_BITS} Bits!`});
        }
        btn.disabled = false;
        btn.innerText = "Start Mining";
        timerBox.style.display = 'none';
    }
}

// --- SPIN LOGIC ---
function spinWheel() {
    const now = Date.now();
    // 24 Hour Cooldown
    if (now - userData.lastSpin < SECONDS_IN_DAY * 1000) {
        tg.showAlert("Come back tomorrow!");
        return;
    }

    const wheel = document.getElementById('wheel');
    const spins = 5; // Rotation multiplier
    const randomSegment = Math.floor(Math.random() * 6); // 0 to 5
    const segment = WHEEL_SEGMENTS[randomSegment];
    const degrees = 360 * spins + (360 - segment.deg); // Calculate stop angle

    wheel.style.transform = `rotate(${degrees}deg)`;
    
    // Wait for animation (4 seconds)
    setTimeout(() => {
        userData.bits += segment.val;
        userData.lastSpin = Date.now();
        saveProgress();
        
        if (segment.val > 0) {
            tg.showPopup({message: `Congrats! You won ${segment.val} Bits!`});
            tg.HapticFeedback.notificationOccurred('success');
        } else {
            tg.HapticFeedback.notificationOccurred('error');
        }
        
        updateUI();
    }, 4000);
}

// --- TAB SWITCHING ---
window.switchTab = function(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-bar button').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');
    document.getElementById(`nav-${tabId}`).classList.add('active');
}

window.toggleModal = function(modalId) {
    const m = document.getElementById(modalId);
    m.style.display = m.style.display === 'flex' ? 'none' : 'flex';
    if(modalId === 'settings-modal') loadLeaderboard();
}

function updateProfileUI() {
    document.getElementById('top-user-img').src = user.photo_url || "https://ui-avatars.com/api/?name=" + user.first_name;
    document.getElementById('profile-img-large').src = user.photo_url || "https://ui-avatars.com/api/?name=" + user.first_name;
    document.getElementById('profile-name').innerText = user.first_name;
    document.getElementById('profile-id').innerText = `ID: ${user.id}`;
    document.getElementById('stat-bits').innerText = userData.bits;
    document.getElementById('stat-hc').innerText = userData.hc;
}

// Init
syncUser();
setInterval(updateUI, 1000);
setInterval(checkMiningState, 60000);
