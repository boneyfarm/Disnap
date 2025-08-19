let watchId;
let lastLat = null, lastLon = null;
let distanceThreshold = 10;
let videoStream;

async function initCamera() {
  const constraints = {
    video: {
      facingMode: "environment",
      width: { ideal: 1920 },
      height: { ideal: 1080 }
    },
    audio: false
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    const video = document.getElementById("video");
    video.srcObject = stream;

    await new Promise(resolve => {
      video.onloadedmetadata = () => resolve();
    });

    videoStream = stream;
  } catch (err) {
    console.error("Camera init error:", err);
  }
}

function haversine(lat1, lon1, lat2, lon2) {
  function toRad(x) { return x * Math.PI / 180; }
  const R = 6371e3;
  const φ1 = toRad(lat1), φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);
  const a = Math.sin(Δφ / 2) ** 2 +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function takePhoto() {
  const video = document.getElementById("video");
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imgData = canvas.toDataURL("image/jpeg", 1.0);

  const a = document.createElement("a");
  a.href = imgData;
  a.download = "photo_" + Date.now() + ".jpg";
  a.click();
}

function startTracking() {
  distanceThreshold = parseFloat(document.getElementById("distanceInput").value);
  if (navigator.geolocation) {
    watchId = navigator.geolocation.watchPosition(pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      if (lastLat !== null && lastLon !== null) {
        const dist = haversine(lastLat, lastLon, lat, lon);
        if (dist >= distanceThreshold) {
          takePhoto();
          lastLat = lat;
          lastLon = lon;
        }
      } else {
        lastLat = lat;
        lastLon = lon;
      }
    }, err => console.error(err), { enableHighAccuracy: true });
  }
}

window.onload = initCamera;
