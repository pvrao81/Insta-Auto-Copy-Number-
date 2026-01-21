chrome.commands.onCommand.addListener(command => {
  if (command === "toggle-extension") {
    chrome.storage.local.get({ enabled: true }, data => {
      const newState = !data.enabled;
      chrome.storage.local.set({ enabled: newState });

      console.log("🔁 Extension toggled via shortcut:", newState);
    });
  }
});
