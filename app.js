// Copyright (c) 2025 Seu Nome. MIT Licensed.

const statusDiv = document.getElementById('status');
const alerta = document.getElementById('alerta');
const lista = document.getElementById('lista');
const salvarConfig = document.getElementById('salvarConfig');

let minMag = parseFloat(localStorage.getItem('minMag') || 7);
let maxDist = parseFloat(localStorage.getItem('maxDist') || 5000);
let maxDepth = parseFloat(localStorage.getItem('maxDepth') || 50);

// Coordenadas de João Pessoa
const latJP = -7.115;
const lonJP = -34.863;

document.getElementById('minMag').value = minMag;
document.getElementById('maxDist').value = maxDist;
document.getElementById('maxDepth').value = maxDepth;

salvarConfig.addEventListener('click', () => {
  minMag = parseFloat(document.getElementById('minMag').value);
  maxDist = parseFloat(document.getElementById('maxDist').value);
  maxDepth = parseFloat(document.getElementById('maxDepth').value);
  localStorage.setItem('minMag', minMag);
  localStorage.setItem('maxDist', maxDist);
  localStorage.setItem('maxDepth', maxDepth);
  checarTerremotos();
});

function verificarConexao() {
  if (navigator.onLine) {
    statusDiv.textContent = '🟢 Online';
    checarTerremotos();
  } else {
    statusDiv.textContent = '🔴 Offline';
  }
}

function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = deg => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 +
            Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function tocarAlarme() {
  const audio = new Audio("alarme.mp3");
  audio.play();
}

function enviarNotificacao(msg) {
  if (Notification.permission === "granted") {
    new Notification(msg);
  }
}

async function checarTerremotos() {
  try {
    const res = await fetch(
      "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson "
    );
    const data = await res.json();
    lista.innerHTML = '';

    data.features.forEach(quake => {
      const mag = quake.properties.mag;
      const lugar = quake.properties.place;
      const tempo = new Date(quake.properties.time).toLocaleString();
      const profundidade = quake.geometry.coordinates[2];
      const [lon, lat] = quake.geometry.coordinates;
      const dist = calcularDistancia(lat, lon, latJP, lonJP);

      const eventoEl = document.createElement('div');
      eventoEl.className = 'evento';
      eventoEl.innerHTML = `
        <strong>${mag}</strong> - ${lugar} (${tempo})<br>
        <small>Distância: ${dist.toFixed(1)} km | Profundidade: ${profundidade} km</small>
      `;
      lista.appendChild(eventoEl);

      if (mag >= minMag && dist <= maxDist && profundidade <= maxDepth) {
        alerta.style.display = "block";
        alerta.textContent = `
          ⚠️ RISCO DE TSUNAMI! Magnitude ${mag} a ${dist.toFixed(0)} km 
          e profundidade ${profundidade} km. EVACUAR!
        `;
        tocarAlarme();
        enviarNotificacao(`Risco de tsunami: ${mag} - ${lugar}`);
      }
    });
  } catch (err) {
    console.error("Erro ao buscar dados:", err);
  }
}

if (Notification.permission !== "granted") Notification.requestPermission();
window.addEventListener('online', verificarConexao);
window.addEventListener('offline', verificarConexao);
verificarConexao();
setInterval(checarTerremotos, 60000);