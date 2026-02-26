/* Unified Script for both LP pages */

document.addEventListener("DOMContentLoaded", () => {
  loadConfig();
  setupForm();
  updateYear();
  setupRedirects();
});

let currentConfig = {};

function updateYear() {
  const yearEl = document.getElementById("current-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

function setupRedirects() {
  // Setup all signup buttons to redirect to signup.html
  document.querySelectorAll('[data-action="signup"]').forEach(btn => {
    btn.addEventListener('click', () => {
      window.location.href = 'signup.html' + window.location.search;
    });
  });
}

async function loadConfig() {
  try {
    const response = await fetch("config.json");
    const fullConfig = await response.json();

    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get("game") || "fortnite";

    const gameConfig = fullConfig[gameId] || fullConfig["fortnite"];

    if (gameConfig) {
      // Allow URL params to override config values
      let finalConfig = {};
      for (const key in gameConfig) {
        finalConfig[key] = urlParams.get(key) || gameConfig[key];
      }
      currentConfig = finalConfig;
      applyConfig(finalConfig);
    } else {
      console.error("Game config not found for:", gameId);
    }

    // Auto-trigger reward animation if URL param exists
    if (urlParams.get("reward") === "true") {
      setTimeout(triggerReward, 300);
    }
  } catch (error) {
    console.error("Error loading config:", error);
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
  }
}

function applyConfig(config) {
  // Text Content Updates using IDs
  updateText("reward-amount-short", config.REWARD_POINTS);
  updateText("reward-amount-desktop", config.REWARD_POINTS);

  // HTML Content Updates - signup.html elements
  updateHTML("hero-headline", config.HERO_HEADLINE || `Claim ${config.GAME_CURRENCY}`);
  updateHTML("hero-subheadline", config.CHALLENGE_TEXT);
  updateHTML("cta-text", config.CTA_TEXT);

  // HTML Content Updates - index.html elements
  updateHTML("index-hero-headline", `Play ${config.GAME_NAME}.<br /><span class="text-neon-cyan text-stroke-neon">Earn ${config.GAME_CURRENCY}!</span>`);
  updateHTML("index-hero-subheadline", `The world's #1 reward platform for ${config.GAME_NAME} players. Complete in-game challenges, level up your account, and claim massive rewards daily.`);
  updateText("index-cta-text", `CLAIM YOUR ${config.GAME_CURRENCY}`);
  updateText("site-title", `${config.GAME_CURRENCY} GiveAway`);

  // Page Title
  if (config.GAME_CURRENCY) {
    document.title = `${config.GAME_CURRENCY} GiveAway - Play & Earn`;
    const titleEl = document.getElementById("page-title");
    if (titleEl) {
      document.title = `Claim ${config.GAME_CURRENCY}`;
    }
  }

  // Hero Image - both pages
  if (config.HERO_IMAGE) {
    const heroImageEl = document.getElementById("hero-image");
    if (heroImageEl) {
      heroImageEl.style.backgroundImage = `url('${config.HERO_IMAGE}')`;
    }
    const indexHeroImageEl = document.getElementById("index-hero-image");
    if (indexHeroImageEl) {
      indexHeroImageEl.style.backgroundImage = `url('${config.HERO_IMAGE}')`;
    }
  }

  // Dynamic Disclaimer
  if (config.GAME_NAME) {
    const disclaimer = document.querySelector("footer p.text-gray-600");
    if (disclaimer) {
      disclaimer.innerText = `Disclaimer: This platform is not affiliated with, maintained, authorized, endorsed, or sponsored by ${config.GAME_NAME} or its developers. Terms and conditions apply. All rewards are subject to availability.`;
    }
  }

  // Theme Colors
  if (config.COLORS) {
    const root = document.documentElement.style;
    if (config.COLORS.primary) root.setProperty("--color-primary", config.COLORS.primary);
    if (config.COLORS.gold) root.setProperty("--color-gold", config.COLORS.gold);
    if (config.COLORS.neon_cyan) root.setProperty("--color-neon-cyan", config.COLORS.neon_cyan);
    if (config.COLORS.background_dark) root.setProperty("--color-bg-dark", config.COLORS.background_dark);
    if (config.COLORS.background_light) root.setProperty("--color-bg-light", config.COLORS.background_light);
  }

  // Handle data-var attributes
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
}

function updateText(id, value) {
  const element = document.getElementById(id);
  if (element && value) element.innerText = value;
}

function updateHTML(id, value) {
  const element = document.getElementById(id);
  if (element && value) element.innerHTML = value;
}

function setupForm() {
  const form = document.querySelector("form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      handleSubmission();
    });
  }
}

function showRewardAnimation() {
  // Create or show overlay
  let overlay = document.getElementById("reward-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "reward-overlay";
    overlay.className =
      "reward-overlay flex flex-col items-center justify-center fixed inset-0 z-50 bg-black/90 backdrop-blur-sm"; // Tailwind classes added
    overlay.innerHTML = `
            <div class="coin-shower p-4">
                <span class="material-symbols-outlined text-gold animate-bounce" style="font-size: 80px;">monetization_on</span>
            </div>
            <h2 class="text-white text-2xl font-black uppercase italic mt-4 animate-pulse">Generating Reward...</h2>
            <p class="text-gold font-bold text-xl mt-2">${currentConfig.REWARD_POINTS || "Points"} Adding...</p>
        `;
    document.body.appendChild(overlay);
  }
  overlay.style.display = "flex";
}

function handleSubmission() {
  // 1. Collect form data before showing animation
  const formData = collectFormData();

  // 2. Store form data in sessionStorage to access during redirect
  sessionStorage.setItem("pendingFormData", JSON.stringify(formData));

  // 3. Show processing/reward animation
  showRewardAnimation();

  // 4. Redirect after a short delay
  redirectToOffer(formData);
}

function collectFormData() {
  const form = document.querySelector("form");
  const formData = new FormData(form);
  const data = {};

  // Collect all form field values by name attribute
  for (let [key, value] of formData.entries()) {
    data[key] = value;
  }

  // Also collect fields by ID as fallback
  const fieldsById = {
    first_name: document.getElementById("first-name")?.value || "",
    last_name: document.getElementById("last-name")?.value || "",
    email: document.getElementById("email")?.value || "",
    phone: document.querySelector('input[name="phone"]')?.value || "",
    country: document.getElementById("country")?.value || "",
    address: document.querySelector('input[name="address"]')?.value || "",
    city: document.querySelector('input[name="city"]')?.value || "",
    state: document.getElementById("state")?.value || "",
    zip: document.querySelector('input[name="zip"]')?.value || "",
    gender: document.querySelector('select[name="gender"]')?.value || "",
    dob: document.querySelector('input[name="dob"]')?.value || "",
  };

  // Merge - form fields with name attributes take priority
  return { ...fieldsById, ...data };
}

function redirectToOffer(formData) {
  // Construct Redirect URL
  const baseOfferUrl = currentConfig.OFFER_URL || "https://www.lootsquest.com";

  const url = new URL(baseOfferUrl);

  // Get existing URL params from current page
  const urlParams = new URLSearchParams(window.location.search);

  // Append all current params to the offer URL
  urlParams.forEach((value, key) => {
    url.searchParams.append(key, value);
  });

  // Append all form field data
  Object.keys(formData).forEach((key) => {
    if (formData[key] && formData[key].trim() !== "") {
      url.searchParams.append(key, formData[key]);
    }
  });

  // Also append game-specific info from config
  if (currentConfig.GAME_NAME) {
    url.searchParams.append("game_name", currentConfig.GAME_NAME);
  }

  if (currentConfig.GAME_CURRENCY) {
    url.searchParams.append("currency", currentConfig.GAME_CURRENCY);
  }

  if (currentConfig.REWARD_POINTS) {
    url.searchParams.append("reward_points", currentConfig.REWARD_POINTS);
  }

  // Clear the stored form data
  sessionStorage.removeItem("pendingFormData");

  window.location.href = url.toString();
}



