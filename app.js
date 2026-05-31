if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js")
    .then(() => console.log("Service Worker registered"))
    .catch(err => console.error("SW registration failed:", err));
}

function openView(module) {
  if (module === "products") {
    window.location.href = "products.html"; // go to Products module page
  }
  else if (module === "customers") {
    window.location.href = "customers.html";
  }
  else if (module === "quotations") {
    window.location.href = "quotations.html";
  }
  else if (module === "gallery") {
    window.location.href = "gallery.html";
  }
  else if (module === "downloads") {
    window.location.href = "downloads.html";
  }
}

