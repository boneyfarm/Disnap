let watchId, mediaStream;
let lastPos = null;
let cumDistance = 0;
let intervalMeters = 20;
let running = false;

const log = (msg) => {
  document.getElementById('log').textContent += msg + "\n";
};

function distanceBetween(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

async function start() {
  intervalMeters = parseFloat(document.getElementById('interval').value) || 20;
  log("Start tracking every " + intervalMeters + " m");

  mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
  document.getElementById('preview').srcObject = mediaStream;

  watchId = navigator.geolocation.watchPosition(pos => {
    const { latitude, longitude, accuracy } = pos.coords;
    if (accuracy > 30) return;
    if (lastPos) {
      const step = distanceBetween(lastPos.lat, lastPos.lon, latitude, longitude);
      cumDistance += step;
      if (cumDistance >= intervalMeters) {
        cumDistance = 0;
        capture();
      }
    }
    lastPos = { lat: latitude, lon: longitude };
  }, err => log("GPS error: " + err.message), { enableHighAccuracy: true });
  running = true;
}

function stop() {
  if (watchId) navigator.geolocation.clearWatch(watchId);
  if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
  running = false;
  log("Stopped");
}

function capture() {
  const video = document.getElementById('preview');
  const canvas = document.getElementById('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'snap_' + Date.now() + '.jpg';
    a.click();
    URL.revokeObjectURL(url);
    log("Captured photo");
  }, 'image/jpeg', 0.9);
}

document.getElementById('startBtn').onclick = () => { if (!running) start(); };
document.getElementById('stopBtn').onclick = stop;