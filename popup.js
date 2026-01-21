const tbody = document.getElementById("leadList");
const clearBtn = document.getElementById("clear");
const toggle = document.getElementById("toggleEnabled");

function copyText(text) {
  if (!text) return;
  navigator.clipboard.writeText(text).catch(() => {});
}

// Load toggle state
chrome.storage.local.get({ enabled: true }, data => {
  toggle.checked = data.enabled;
});

// Save toggle state
toggle.addEventListener("change", () => {
  chrome.storage.local.set({ enabled: toggle.checked });
});

function loadLeads() {
  chrome.storage.local.get({ leads: [] }, data => {
    tbody.innerHTML = "";

    if (!data.leads.length) {
      const row = document.createElement("tr");
      row.innerHTML = "<td colspan='4'>No leads yet</td>";
      tbody.appendChild(row);
      return;
    }

    const grouped = {};
    data.leads.forEach(lead => {
      if (!grouped[lead.username]) grouped[lead.username] = [];
      grouped[lead.username].push(lead);
    });

    Object.keys(grouped).forEach(username => {
      const phoneRows = grouped[username].filter(l => l.type === "phone");
      const emailRows = grouped[username].filter(l => l.type === "email");

      [...phoneRows, ...emailRows].forEach(lead => {
        const row = document.createElement("tr");

        row.className =
          lead.type === "phone"
            ? lead.valid
              ? "valid"
              : "invalid"
            : "";

        const valueToCopy =
          lead.type === "phone" ? lead.phone : lead.email;

        row.innerHTML = `
          <td>${lead.username}</td>
          <td>${lead.type === "phone" ? lead.phone : ""}</td>
          <td>${lead.type === "email" ? lead.email : ""}</td>
          <td>
            ${valueToCopy ? `<button class="copy-btn">Copy</button>` : ""}
          </td>
        `;

        const copyBtn = row.querySelector(".copy-btn");
        if (copyBtn) {
          copyBtn.addEventListener("click", () => {
            copyText(valueToCopy);
          });
        }

        tbody.appendChild(row);
      });
    });
  });
}

clearBtn.addEventListener("click", () => {
  chrome.storage.local.set({ leads: [] }, loadLeads);
});

loadLeads();
