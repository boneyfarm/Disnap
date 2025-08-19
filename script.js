let watchId = null;
let lastLat = null, lastLon = null;
let distanceThreshold = 10;
let videoStream = null;
let captureWidth = 1600, captureHeight = 1200;
let totalDistance = 0;
let photoCount = 0;

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
    console.log("Camera started!");
  } catch (err) {
    alert("ไม่สามารถเปิดกล้องได้: " + err.message);
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
  const canvas = document.createElement("canvas");
  
  // รักษา aspect ratio ของ video
  const videoRatio = video.videoWidth / video.videoHeight;
  const targetRatio = captureWidth / captureHeight;
  
  let drawWidth, drawHeight, offsetX=0, offsetY=0;
  
  if(videoRatio > targetRatio){
    // video กว้างกว่า canvas → crop ซ้ายขวา
    drawHeight = video.videoHeight;
    drawWidth = drawHeight * targetRatio;
    offsetX = (video.videoWidth - drawWidth)/2;
    offsetY = 0;
  } else {
    // video สูงกว่า canvas → crop บนล่าง
    drawWidth = video.videoWidth;
    drawHeight = drawWidth / targetRatio;
    offsetX = 0;
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
  document.getElementById("totalDistance").textContent = totalDistance;
  document.getElementById("photoCount").textContent = photoCount;

  const video = document.getElementById("video");

  if (navigator.geolocation) {
    watchId = navigator.geolocation.watchPosition(pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      if (lastLat !== null && lastLon !== null) {
        const dist = haversine(lastLat, lastLon, lat, lon);
        totalDistance += dist;
        document.getElementById("totalDistance").textContent = Math.round(totalDistance);
        
        if (dist >= distanceThreshold) {
          takePhoto(video);
        }
      }

      // อัปเดต lastLat/lastLon ทุกครั้ง
      lastLat = lat;
      lastLon = lon;

    }, err => alert("GPS error: " + err.message), { enableHighAccuracy: true });
  } else {
    alert("เบราว์เซอร์นี้ไม่รองรับ GPS");
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
  alert("หยุดการถ่ายรูปเรียบร้อยแล้ว");
}