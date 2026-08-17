document.getElementById("key-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const key = document.getElementById("admin-key").value.trim();
  const msg = document.getElementById("admin-msg");
  const dashboard = document.getElementById("dashboard");
  msg.textContent = "Loading…";
  msg.className = "msg";

  try {
    const res = await fetch(`${JOSEBUB_API_BASE}/api/admin/stats`, {
      headers: { "x-admin-key": key },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to load stats");

    msg.textContent = "";
    dashboard.classList.remove("hidden");

    document.getElementById("stat-users").textContent = data.userCount;
    document.getElementById("stat-views").textContent = data.adViewCount;
    document.getElementById("stat-rewarded").textContent = `KES ${data.totalRewardedToUsers.toFixed(2)}`;
    document.getElementById("stat-withdrawn").textContent = `KES ${data.totalWithdrawn.toFixed(2)}`;
    document.getElementById("stat-pending").textContent = `KES ${data.pendingWithdrawals.toFixed(2)}`;
    document.getElementById("stat-held").textContent = `KES ${data.heldInWallets.toFixed(2)}`;
    document.getElementById("stat-revenue").textContent = `KES ${data.estimatedAdRevenue.toFixed(2)}`;
    document.getElementById("stat-margin").textContent = `KES ${data.estimatedMargin.toFixed(2)}`;

    const wBody = document.getElementById("withdrawals-body");
    wBody.innerHTML = data.recentWithdrawals
      .map(
        (w) =>
          `<tr><td>${w.id}</td><td>${w.phone}</td><td>KES ${w.amountKes.toFixed(2)}</td><td>${w.status}</td><td>${w.created_at}</td></tr>`
      )
      .join("");

    const sBody = document.getElementById("signups-body");
    sBody.innerHTML = data.recentSignups
      .map((s) => `<tr><td>${s.id}</td><td>${s.phone}</td><td>${s.created_at}</td></tr>`)
      .join("");
  } catch (err) {
    msg.className = "msg error";
    msg.textContent = err.message;
    dashboard.classList.add("hidden");
  }
});
