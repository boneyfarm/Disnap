let watchId = null;
let lastLat = null, lastLon = null;
let distanceThreshold = 10;
let videoStream = null;
let captureWidth = 1600, captureHeight = 1200;
let totalDistance = 0;
let photoCount = 0;
let distanceSinceLastPhoto = 0;

// ฟังก์ชัน log ที่โชว์ทั้ง console และหน้าเว็บ
function log(msg) {
  console.log(msg);
  const logBox = document.getElementById("log");
  logBox.textContent += msg + "\n";
  logBox.scrollTop = logBox.scrollHeight;
}

async function initCamera() {
  const video = document.getElementById("video");
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false
    });
    video.srcObject = stream;
    await video.play();
    videoStream = stream;
    log("✅ Camera started!");
  } catch (err) {
    alert("ไม่สามารถเปิดกล้องได้: " + err.message);
    log("❌ Camera error: " + err.message);
  }
}

function haversine(lat1, lon1, lat2, lon2) {
  const toRad = x => x * Math.PI / 180;
  const R = 6371e3;
  const φ1 = toRad(lat1), φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);
  const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function takePhoto(video) {
  if (!video.videoWidth || !video.videoHeight) {
    log("⚠️ Video not ready yet, skip photo");
    return;
  }

  const canvas = document.createElement("canvas");
  
  const videoRatio = video.videoWidth / video.videoHeight;
  const targetRatio = captureWidth / captureHeight;
  
  let drawWidth, drawHeight, offsetX=0, offsetY=0;
  
  if(videoRatio > targetRatio){
    drawHeight = video.videoHeight;
    drawWidth = drawHeight * targetRatio;
    offsetX = (video.videoWidth - drawWidth)/2;
  } else {
    drawWidth = video.videoWidth;
    drawHeight = drawWidth / targetRatio;
    offsetY = (video.videoHeight - drawHeight)/2;
  }
  
  canvas.width = captureWidth;
  canvas.height = captureHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight, 0, 0, captureWidth, captureHeight);

  const imgData = canvas.toDataURL("image/jpeg", 1.0);
  const a = document.createElement("a");
  a.href = imgData;
  a.download = "photo_" + Date.now() + ".jpg";
  a.click();

  photoCount++;
  document.getElementById("photoCount").textContent = photoCount;
  log("📸 Photo taken, count = " + photoCount);

  distanceSinceLastPhoto = 0;
}

async function startTracking() {
  distanceThreshold = parseFloat(document.getElementById("distanceInput").value);
  const resValue = document.getElementById("resolutionSelect").value;
  [captureWidth, captureHeight] = resValue.split("x").map(Number);

  await initCamera();

  lastLat = null;
  lastLon = null;
  totalDistance = 0;
  photoCount = 0;
  distanceSinceLastPhoto = 0;
  document.getElementById("totalDistance").textContent = totalDistance;
  document.getElementById("photoCount").textContent = photoCount;
  document.getElementById("log").textContent = ""; // reset log

  const video = document.getElementById("video");

  if (navigator.geolocation) {
    watchId = navigator.geolocation.watchPosition(pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      log("📍 GPS update: " + lat + ", " + lon);

      if (lastLat !== null && lastLon !== null) {
        const dist = haversine(lastLat, lastLon, lat, lon);
        totalDistance += dist;
        distanceSinceLastPhoto += dist;

        log("➕ Distance moved: " + dist.toFixed(2) + " m | Total: " + totalDistance.toFixed(2));

        document.getElementById("totalDistance").textContent = Math.round(totalDistance);

        if (distanceSinceLastPhoto >= distanceThreshold) {
          log("🎯 Threshold reached, taking photo...");
          takePhoto(video);
        }
      }

      lastLat = lat;
      lastLon = lon;

    }, err => {
      alert("GPS error: " + err.message);
      log("❌ GPS error: " + err.message);
    }, { enableHighAccuracy: true });
  } else {
    alert("เบราว์เซอร์นี้ไม่รองรับ GPS");
    log("❌ No geolocation support");
  }
}

function stopTracking() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
    videoStream = null;
  }
  lastLat = null;
  lastLon = null;
  distanceSinceLastPhoto = 0;
  alert("หยุดการถ่ายรูปเรียบร้อยแล้ว");
  log("🛑 Tracking stopped");
}

function manualPhoto() {
  const video = document.getElementById("video");
  log("📸 Manual photo button pressed");
  takePhoto(video);
}
