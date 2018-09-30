if ("serviceWorker" in navigator) {
  window.addEventListener("load", function() {
    navigator.serviceWorker.register("/sw.js")
    .then(function() {
      console.log("SW registered.");
    })
    .catch(function() {
      console.log('SW registration failed.');
    });
  });
}
