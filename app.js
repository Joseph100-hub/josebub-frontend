// Josebub frontend logic — talks to the real backend at JOSEBUB_API_BASE (see config.js)

const AD_NETWORK_PAYOUT_KES = 0.6; // must match backend AD_NETWORK_PAYOUT_CENTS/100
const USER_SHARE = 0.5;
const USER_PAYOUT_KES = +(AD_NETWORK_PAYOUT_KES * USER_SHARE).toFixed(2);
const AD_SECONDS = 6;

const VIDEOS = [
  { title: "Nairobi street food tour", brand: "Ad · Zuri Foods" },
  { title: "5-minute home workout", brand: "Ad · FitKe" },
  { title: "New phone unboxing", brand: "Ad · TekoMobile" },
];

let userId = null;
let balanceKes = 0;
let videoIndex = 0;
let watching = false;

// ---- init ledger display with the constants (works even before signup) ----
document.getElementById("ledger-network").textContent = `KES ${AD_NETWORK_PAYOUT_KES.toFixed(2)}`;
document.getElementById("ledger-user").textContent = `KES ${USER_PAYOUT_KES.toFixed(2)}`;
document.getElementById("ledger-margin").textContent = `KES ${(AD_NETWORK_PAYOUT_KES - USER_PAYOUT_KES).toFixed(2)}`;
document.getElementById("ledger-share-label").textContent = `Your share (${USER_SHARE * 100}%)`;
document.getElementById("watch-label").textContent = `Watch to earn KES ${USER_PAYOUT_KES.toFixed(2)}`;
document.getElementById("earn-amount").textContent = `+${USER_PAYOUT_KES.toFixed(2)}`;

async function api(path, options = {}) {
  const res = await fetch(`${JOSEBUB_API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Something went wrong");
  return data;
}

function updateBalanceUI() {
  document.getElementById("balance").textContent = `KES ${balanceKes.toFixed(2)}`;
  document.getElementById("modal-balance").textContent = `KES ${balanceKes.toFixed(2)}`;
}

function renderVideo() {
  document.getElementById("video-title").textContent = VIDEOS[videoIndex].title;
  document.getElementById("video-brand").textContent = VIDEOS[videoIndex].brand;
}

function addActivityRow(title, amountKes) {
  const list = document.getElementById("activity-list");
  const emptyState = list.querySelector(".empty-state");
  if (emptyState) emptyState.remove();

  const li = document.createElement("li");
  li.innerHTML = `<span>${title}</span><span>+KES ${amountKes.toFixed(2)}</span>`;
  list.prepend(li);
}

// ---- signup ----
document.getElementById("signup-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const phone = document.getElementById("phone").value.trim();
  const msg = document.getElementById("signup-msg");
  msg.className = "msg";
  msg.textContent = "Creating your wallet…";

  try {
    const { user } = await api("/api/signup", { method: "POST", body: JSON.stringify({ phone }) });
    userId = user.id;
    balanceKes = user.balance;
    updateBalanceUI();
    msg.textContent = `Wallet ready for ${phone}.`;
    document.getElementById("signup-section").classList.add("hidden");
    document.getElementById("watch-section").classList.remove("hidden");
    renderVideo();
  } catch (err) {
    msg.className = "msg error";
    msg.textContent = err.message;
  }
});

// ---- watch & earn ----
document.getElementById("watch-btn").addEventListener("click", () => {
  if (watching || !userId) return;
  watching = true;

  const btn = document.getElementById("watch-btn");
  const countdown = document.getElementById("countdown");
  btn.classList.add("hidden");
  countdown.classList.remove("hidden");

  let secondsLeft = AD_SECONDS;
  countdown.textContent = secondsLeft;

  const interval = setInterval(async () => {
    secondsLeft -= 1;
    countdown.textContent = secondsLeft;
    if (secondsLeft <= 0) {
      clearInterval(interval);
      await finishWatch();
      btn.classList.remove("hidden");
      countdown.classList.add("hidden");
      watching = false;
    }
  }, 1000);
});

async function finishWatch() {
  const adEventId = `web-${userId}-${Date.now()}`;
  try {
    const result = await api("/api/ad/complete", {
      method: "POST",
      body: JSON.stringify({ userId, adEventId }),
    });
    balanceKes = result.balance;
    updateBalanceUI();
    addActivityRow(VIDEOS[videoIndex].title, result.credited);
    videoIndex = (videoIndex + 1) % VIDEOS.length;
    renderVideo();
  } catch (err) {
    alert(err.message);
  }
}

// ---- withdraw ----
const modal = document.getElementById("withdraw-modal");
document.getElementById("withdraw-btn").addEventListener("click", () => {
  document.getElementById("modal-msg").textContent = "";
  updateBalanceUI();
  modal.classList.remove("hidden");
});
document.getElementById("modal-close").addEventListener("click", () => modal.classList.add("hidden"));
modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.add("hidden"); });

document.getElementById("modal-confirm").addEventListener("click", async () => {
  const msg = document.getElementById("modal-msg");
  try {
    const result = await api("/api/withdraw", { method: "POST", body: JSON.stringify({ userId }) });
    balanceKes = 0;
    updateBalanceUI();
    msg.className = "msg";
    msg.textContent = `Withdrawal of KES ${result.amount} requested. ${result.note}`;
  } catch (err) {
    msg.className = "msg error";
    msg.textContent = err.message;
  }
});

document.getElementById("min-withdraw").textContent = "KES 50";
