document.addEventListener('DOMContentLoaded', () => {
  const minutesInput = document.getElementById('minutes');
  const secondsInput = document.getElementById('seconds');
  const startButton = document.getElementById('start');
  const stopButton = document.getElementById('stop');
  const status = document.getElementById('status');

  const alarmName = 'refreshAlarm';

  // Function to update button states and status
  function updateUI(customStatus = null) {
    chrome.alarms.get(alarmName, (alarm) => {
      const isActive = !!alarm;
      if (isActive) {
        startButton.setAttribute('disabled', 'disabled');
        stopButton.removeAttribute('disabled');
      } else {
        startButton.removeAttribute('disabled');
        stopButton.setAttribute('disabled', 'disabled');
      }
      status.textContent = customStatus || (isActive ? 'Refreshing...' : 'Stopped');
    });
  }

  // Load saved interval and split into minutes/seconds
  chrome.storage.sync.get('refreshInterval', (data) => {
    if (data.refreshInterval) {
      const totalSeconds = data.refreshInterval;
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      minutesInput.value = minutes;
      secondsInput.value = seconds;
    }
    updateUI(); // Check current state
  });

  startButton.addEventListener('click', () => {
    const minutes = parseInt(minutesInput.value) || 0;
    const seconds = parseInt(secondsInput.value) || 0;
    const totalInterval = (minutes * 60) + seconds;

    if (isNaN(totalInterval) || totalInterval < 1 || seconds < 0 || seconds > 59) {
      status.textContent = 'Enter valid values: minutes >=0, seconds 0-59, total >=1 second.';
      return;
    }

    // Save total interval in seconds
    chrome.storage.sync.set({ refreshInterval: totalInterval });

    // Get current tab and send message to background
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0].id;
      chrome.runtime.sendMessage({ action: 'startRefresh', tabId, interval: totalInterval }, (response) => {
        if (response && response.success) {
          let displayText = 'Refreshing every ';
          if (minutes > 0) displayText += `${minutes} minute${minutes > 1 ? 's' : ''} `;
          if (minutes > 0 && seconds > 0) displayText += 'and ';
          if (seconds > 0 || minutes === 0) displayText += `${seconds} second${seconds > 1 ? 's' : ''}.`;
          updateUI(displayText); // Pass custom status
        }
      });
    });
  });

  stopButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'stopRefresh' }, (response) => {
      if (response && response.success) {
        updateUI('Refresh stopped.'); // Pass custom status
      }
    });
  });
});