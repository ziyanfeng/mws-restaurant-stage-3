if ("serviceWorker" in navigator) {
  window.addEventListener("load", function() {
    navigator.serviceWorker.register("/sw.js", {scope: "/"})
    .then(function() {
      console.log("SW registered.");
    })
    .catch(function() {
      console.log('SW registration failed.');
    });
  });
}
