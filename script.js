let watchId;
let lastLat = null, lastLon = null;
let distanceThreshold = 10;
let videoStream;

async function initCamera() {
  const video = document.getElementById("video");
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
    video.srcObject = stream;
    await video.play();
    videoStream = stream;
    console.log("Camera started with resolution:", video.videoWidth, "x", video.videoHeight);
  } catch (err) {
    console.error("Camera init error:", err);
    alert("ไม่สามารถเปิดกล้องได้: " + err.message);
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
  if (!video.videoWidth || !video.videoHeight) {
    alert("ไม่พบวิดีโอจากกล้อง");
    return;
  }
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

async function startTracking() {
  distanceThreshold = parseFloat(document.getElementById("distanceInput").value);

  // เริ่มกล้อง
  await initCamera();

  // เริ่ม GPS
  if (navigator.geolocation) {
    watchId = navigator.geolocation.watchPosition(pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      console.log("GPS:", lat, lon);

      if (lastLat !== null && lastLon !== null) {
        const dist = haversine(lastLat, lastLon, lat, lon);
        console.log("Moved:", dist, "meters");
        if (dist >= distanceThreshold) {
          takePhoto();
          lastLat = lat;
          lastLon = lon;
        }
      } else {
        lastLat = lat;
        lastLon = lon;
      }
    }, err => {
      console.error("GPS error:", err);
      alert("ไม่สามารถใช้ GPS ได้: " + err.message);
    }, { enableHighAccuracy: true });
  } else {
    alert("เบราว์เซอร์นี้ไม่รองรับ GPS");
  }
}