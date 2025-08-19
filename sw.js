self.addEventListener("install", e => {
  console.log("Service Worker installed");
});
self.addEventListener("fetch", e => {
  // ทำให้โหลด offline ได้ (optional)
});