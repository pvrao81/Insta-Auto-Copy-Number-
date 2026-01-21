let currentTabId = null;
let currentAlarmName = 'refreshAlarm';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startRefresh') {
    currentTabId = message.tabId;
    const intervalInMinutes = message.interval / 60;

    chrome.alarms.clear(currentAlarmName);
    chrome.alarms.create(currentAlarmName, { periodInMinutes: intervalInMinutes });
    sendResponse({ success: true });
  } else if (message.action === 'stopRefresh') {
    chrome.alarms.clear(currentAlarmName);
    currentTabId = null;
    sendResponse({ success: true });
  }
  // For other messages (like from shortcuts), no response needed
  return true; // Keeps the message channel open if needed (though actions are sync here)
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === currentAlarmName && currentTabId) {
    chrome.tabs.reload(currentTabId);
  }
});

// New: Listen for keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  if (command === 'start-refresh') {
    chrome.storage.sync.get('refreshInterval', (data) => {
      if (data.refreshInterval) {
        const interval = data.refreshInterval;
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs.length > 0) {
            currentTabId = tabs[0].id;
            const intervalInMinutes = interval / 60;

            chrome.alarms.clear(currentAlarmName);
            chrome.alarms.create(currentAlarmName, { periodInMinutes: intervalInMinutes });
          }
        });
      } else {
        // Optional: Notify user if no interval is set
        chrome.notifications.create({
          title: 'Venny Auto Refresher',
          message: 'Set an interval in the popup first!',
          iconUrl: '/icon128.png',
          type: 'basic'
        });
      }
    });
  } else if (command === 'stop-refresh') {
    chrome.alarms.clear(currentAlarmName);
    currentTabId = null;
  }
});