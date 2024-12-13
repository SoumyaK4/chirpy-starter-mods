document.addEventListener("DOMContentLoaded", () => {
    let deferredPrompt; // Store the install prompt event

    // Listen for the beforeinstallprompt event
    window.addEventListener("beforeinstallprompt", (e) => {
        // Prevent the default mini-infobar from appearing
        e.preventDefault();
        // Save the event for later use
        deferredPrompt = e;

        // Check if we're on the About page
        if (window.location.pathname.includes("about")) {
            // Trigger the prompt after 2 seconds
            setTimeout(() => {
                if (deferredPrompt) {
                    deferredPrompt.prompt();

                    // Wait for the user's response
                    deferredPrompt.userChoice.then((choiceResult) => {
                        if (choiceResult.outcome === "accepted") {
                            console.log("User accepted the install prompt");
                        } else {
                            console.log("User dismissed the install prompt");
                        }
                        // Clear the deferred prompt variable
                        deferredPrompt = null;
                    });
                }
            }, 2000); // 2-second delay
        }
    });

    // Optionally, log the appinstalled event
    window.addEventListener("appinstalled", () => {
        console.log("PWA installed successfully!");
    });
});
