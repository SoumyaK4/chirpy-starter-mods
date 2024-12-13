document.addEventListener("DOMContentLoaded", () => {
    let deferredPrompt; // Store the install prompt event
    let popupDisplayed = false; // Ensure the popup shows only once

    // Create the popup dynamically
    const popup = document.createElement("div");
    popup.id = "install-pwa-popup";
    popup.innerHTML = `
      <div id="popup-content">
        <p>Install our app for a better experience!</p>
        <button id="install-pwa-yes">Install</button>
        <button id="install-pwa-no">Close</button>
      </div>
    `;
    document.body.appendChild(popup);

    // Style the popup
    const popupStyles = `
      #install-pwa-popup {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #2a1e6b;
        color: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        display: none;
        z-index: 1000;
      }
      #popup-content {
        display: flex;
        flex-direction: column;
        gap: 10px;
        align-items: center;
      }
      #install-pwa-popup button {
        padding: 10px 20px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
      }
      #install-pwa-yes {
        background-color: #4caf50;
        color: white;
      }
      #install-pwa-no {
        background-color: #f44336;
        color: white;
      }
    `;
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = popupStyles;
    document.head.appendChild(styleSheet);

    // Listen for the beforeinstallprompt event
    window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        deferredPrompt = e;

        // Show the popup after 10 seconds
        setTimeout(() => {
            if (!popupDisplayed && !window.matchMedia("(display-mode: standalone)").matches) {
                popup.style.display = "block";
                popupDisplayed = true;
            }
        }, 10000); // 10-second delay
    });

    // Handle the Install button click
    document.getElementById("install-pwa-yes").addEventListener("click", async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const choiceResult = await deferredPrompt.userChoice;
            if (choiceResult.outcome === "accepted") {
                console.log("User accepted the install prompt");
            } else {
                console.log("User dismissed the install prompt");
            }
            deferredPrompt = null; // Clear the event
        }
        popup.style.display = "none"; // Hide the popup
    });

    // Handle the Close button click
    document.getElementById("install-pwa-no").addEventListener("click", () => {
        popup.style.display = "none";
    });

    // Hide popup if app is installed
    window.addEventListener("appinstalled", () => {
        console.log("PWA installed");
        popup.style.display = "none";
    });
});
