document.addEventListener("DOMContentLoaded", () => {
  loadConfig();
  updateYear();
});

function updateYear() {
  const yearEl = document.getElementById("current-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

async function loadConfig() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const gameKey = urlParams.get("game") || "fortnite";

    const response = await fetch("config.json");
    const allConfigs = await response.json();

    const gameConfig = allConfigs[gameKey] || allConfigs["fortnite"];

    let finalConfig = {};
    for (const key in gameConfig) {
      finalConfig[key] = urlParams.get(key) || gameConfig[key];
    }

    applyConfig(finalConfig);

    // Auto-trigger reward animation if URL param exists
    if (urlParams.get("reward") === "true") {
      setTimeout(triggerReward, 1000); // 1s delay for better UX
    }
  } catch (error) {
    console.error("Error loading configuration:", error);
  }
}

function triggerReward() {
  const overlay = document.getElementById("reward-overlay");
  if (overlay) overlay.classList.add("active");
}

function hideReward() {
  const overlay = document.getElementById("reward-overlay");
  if (overlay) {
    overlay.classList.remove("active");
    // Option: could redirect after closing
    // handleCTAClick();
  }
}

function applyConfig(config) {
  document.querySelectorAll("[data-var]").forEach((el) => {
    const varName = el.getAttribute("data-var");
    if (config[varName]) {
      if (el.tagName === "IMG") {
        el.src = config[varName];
      } else if (el.hasAttribute("data-bg")) {
        el.style.backgroundImage = `url("${config[varName]}")`;
      } else if (el.tagName === "TITLE") {
        document.title = config[varName];
      } else {
        el.innerHTML = config[varName];
      }
    }
  });

  // Handle background image specifically if not caught by data-bg loop
  const heroImage = document.querySelector('[data-var="HERO_IMAGE"]');
  if (heroImage && config.HERO_IMAGE) {
    heroImage.style.backgroundImage = `url("${config.HERO_IMAGE}")`;
  }
}

function handleCTAClick() {
  const urlParams = new URLSearchParams(window.location.search);
  const destination = urlParams.get("redirect") || "http://lootsquest.com";

  const trackingParams = new URLSearchParams();
  ["source", "campaign", "reward_hint", "game", "geo"].forEach((param) => {
    if (urlParams.has(param)) trackingParams.set(param, urlParams.get(param));
  });

  const finalUrl =
    destination +
    (destination.includes("?") ? "&" : "?") +
    trackingParams.toString();
  window.location.href = finalUrl;
}
