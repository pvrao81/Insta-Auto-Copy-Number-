console.log("📞 Instagram Phone Copier v6 running");

const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/gi;
const phoneRegex = /(\+?\d[\d\s().-]{5,20}\d)/g;

let savedLeads = [];
let observerStarted = false;
let isEnabled = true;

function loadState() {
  chrome.storage.local.get({ leads: [], enabled: true }, data => {
    savedLeads = data.leads || [];
    isEnabled = data.enabled;
  });
}

// Listen for toggle changes live
chrome.storage.onChanged.addListener(changes => {
  if (changes.enabled) {
    isEnabled = changes.enabled.newValue;
    console.log("🔁 Extension enabled:", isEnabled);
  }
});

function normalizePhone(phone) {
  let cleaned = phone.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("00")) cleaned = "+" + cleaned.slice(2);
  return cleaned;
}

function getFriendUsername() {
  try {
    const profileLink = document.querySelector(
      'div[role="presentation"] a[aria-label*="Open the profile page"]'
    );
    if (!profileLink) return "Unknown";
    return profileLink.getAttribute("href").replace(/\//g, "");
  } catch {
    return "Unknown";
  }
}

function getMessageSender(row, friendUsername) {
  try {
    if (row.querySelector('[aria-label*="You"]')) return "You";
    if (row.querySelector('a[aria-label*="Open the profile page"]'))
      return friendUsername;
    return "You";
  } catch {
    return "You";
  }
}

function copyToClipboard(text) {
  navigator.clipboard?.writeText(text).catch(() => {});
}

function scanForNumbers() {
  if (!isEnabled) return;

  const friendUsername = getFriendUsername();
  const messages = document.querySelectorAll('div[role="row"]');

  messages.forEach(row => {
    const sender = getMessageSender(row, friendUsername);
    const spans = row.querySelectorAll("span");

    spans.forEach(span => {
      const text = span.innerText.trim();
      if (!text) return;

      const phoneMatches = text.match(phoneRegex) || [];
      const emailMatches = text.match(emailRegex) || [];

      phoneMatches.forEach(rawPhone => {
        const phone = normalizePhone(rawPhone);
        const digits = phone.replace(/\D/g, "");
        const isValid = digits.length >= 10;

        copyToClipboard(phone);

        const exists = savedLeads.some(
          l =>
            l.type === "phone" &&
            l.username === sender &&
            normalizePhone(l.phone) === phone
        );
        if (exists) return;

        savedLeads.push({
          username: sender,
          type: "phone",
          phone,
          email: "",
          valid: isValid
        });

        chrome.storage.local.set({ leads: savedLeads });
      });

      emailMatches.forEach(email => {
        const exists = savedLeads.some(
          l =>
            l.type === "email" &&
            l.username === sender &&
            l.email.toLowerCase() === email.toLowerCase()
        );
        if (exists) return;

        savedLeads.push({
          username: sender,
          type: "email",
          phone: "",
          email,
          valid: true
        });

        chrome.storage.local.set({ leads: savedLeads });
      });
    });
  });
}

function startObserver() {
  if (observerStarted) return;
  observerStarted = true;

  const observer = new MutationObserver(scanForNumbers);
  observer.observe(document.body, { childList: true, subtree: true });
}

setTimeout(() => {
  loadState();
  startObserver();
}, 3000);
