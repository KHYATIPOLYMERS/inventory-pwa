if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js")
    .then(() => console.log("Service Worker registered"))
    .catch(err => console.error("SW registration failed:", err));
}

function openView(module) {
  const map = {
    products: "modules/products/products.html",
    customers: "modules/customers/customers.html",
    quotations: "modules/quotations/quotations.html",
    gallery: "modules/gallery/gallery.html",
    downloads: "modules/downloads/downloads.html"
  };
  const target = map[module];
  if (target) window.location.href = target;
  else console.warn("Unknown module:", module);
}


