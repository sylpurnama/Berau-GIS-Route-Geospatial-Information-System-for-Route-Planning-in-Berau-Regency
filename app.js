// Inisialisasi peta
var map = L.map('map').setView([2.1538651, 117.4970133], 12);

// Tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

var control, currentLocationMarker, searchMarker;
var startCoords = null, endCoords = null;

// Geocoding
async function geocodeLocation(locationName) {
  const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName + ', Berau, Kalimantan Timur')}&limit=1`);
  const data = await response.json();
  if (data && data.length > 0) {
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), display_name: data[0].display_name };
  } else {
    throw new Error('Lokasi tidak ditemukan');
  }
}

// UI feedback
function showLoading(msg) {
  document.getElementById('result').innerHTML = `<span class="loading">${msg}</span>`;
}
function showError(msg) {
  document.getElementById('result').innerHTML = `<span class="error">${msg}</span>`;
  document.getElementById('result').className = 'result-box error';
  setTimeout(() => { document.getElementById('result').className = 'result-box'; }, 3000);
}

// Search lokasi
document.getElementById('searchButton').addEventListener('click', async function() {
  const query = document.getElementById('searchInput').value.trim();
  if (!query) { alert('Masukkan nama lokasi!'); return; }
  showLoading('Mencari lokasi...');
  try {
    const location = await geocodeLocation(query);
    if (searchMarker) map.removeLayer(searchMarker);
    searchMarker = L.marker([location.lat, location.lng]).addTo(map)
      .bindPopup(`<b>Lokasi:</b><br>${location.display_name}`).openPopup();
    map.setView([location.lat, location.lng], 15);
    document.getElementById('result').innerHTML = `
      <b>Lokasi Ditemukan:</b><br>
      ${location.display_name}<br>
      Koordinat: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}
    `;
  } catch (err) { showError(err.message); }
});

// Gunakan posisi saat ini
document.getElementById('useCurrentButton').addEventListener('click', function() {
  if (!navigator.geolocation) { showError('Geolocation tidak didukung'); return; }
  showLoading('Mendapatkan posisi...');
  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      startCoords = [lat, lng];
      if (currentLocationMarker) map.removeLayer(currentLocationMarker);
      currentLocationMarker = L.marker([lat, lng]).addTo(map).bindPopup('<b>Posisi Anda</b>').openPopup();
      document.getElementById('startInput').value = `Posisi Saat Ini (${lat.toFixed(6)}, ${lng.toFixed(6)})`;
      map.setView([lat, lng], 15);
      document.getElementById('result').innerHTML = `
        <b>Posisi Saat Ini:</b><br>
        Latitude: ${lat.toFixed(6)}<br>Longitude: ${lng.toFixed(6)}
      `;
    },
    () => showError('Gagal mendapatkan posisi'),
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
  );
});

// Cari rute
document.getElementById('routeButton').addEventListener('click', async function() {
  const startInput = document.getElementById('startInput').value.trim();
  const endInput = document.getElementById('endInput').value.trim();
  const vehicleFactor = parseFloat(document.getElementById('vehicleSelect').value);
  if (!endInput) { alert('Masukkan tujuan!'); return; }
  showLoading('Mencari rute...');
  try {
    if (startInput && !startInput.includes('Posisi Saat Ini')) {
      const startLocation = await geocodeLocation(startInput);
      startCoords = [startLocation.lat, startLocation.lng];
    } else if (!startCoords) {
      startCoords = [map.getCenter().lat, map.getCenter().lng];
    }
    const endLocation = await geocodeLocation(endInput);
    endCoords = [endLocation.lat, endLocation.lng];
    if (control) map.removeControl(control);
    control = L.Routing.control({
      waypoints: [L.latLng(startCoords[0], startCoords[1]), L.latLng(endCoords[0], endCoords[1])],
      router: L.Routing.osrmv1({ serviceUrl: 'https://router.project-osrm.org/route/v1' }),
      show: false, addWaypoints: false, routeWhileDragging: false
    }).addTo(map);

    control.on('routesfound', function(e) {
      const route = e.routes[0];
      map.fitBounds(L.latLngBounds(route.coordinates));
      const distance = (route.summary.totalDistance / 1000).toFixed(2);
      const minutes = Math.round(route.summary.totalTime / 60);
      const hours = Math.floor(minutes / 60), remainMin = minutes % 60;
      const co2 = (distance * vehicleFactor).toFixed(3);

      let timeDisplay = (hours > 0) ? `${hours} jam ${remainMin} menit` : `${minutes} menit`;
      let vehicleType = '';
      switch(vehicleFactor) {
        case 0.114: vehicleType = '🚲 Sepeda Motor'; break;
        case 0.170: vehicleType = '🚗 Mobil Bensin'; break;
        case 0.171: vehicleType = '🚙 Mobil Diesel'; break;
        case 0.047: vehicleType = '⚡ Mobil Listrik'; break;
        case 0.097: vehicleType = '🚌 Bus'; break;
        case 0.200: vehicleType = '🚚 Truk Kecil'; break;
        case 0.350: vehicleType = '🚛 Truk Besar'; break;
        default: vehicleType = 'Kendaraan';
      }

      let impactLevel='', impactColor='';
      if (co2 < 1) { impactLevel='Rendah'; impactColor='#4CAF50'; }
      else if (co2 < 5) { impactLevel='Sedang'; impactColor='#FF9800'; }
      else { impactLevel='Tinggi'; impactColor='#F44336'; }

      document.getElementById('result').innerHTML = `
        <b>Info Perjalanan (${vehicleType}):</b><br>
        📏 Jarak: ${distance} km <br>
        ⏱️ Estimasi Waktu: ${timeDisplay} <br>
        🌱 Emisi CO₂: <span style="font-weight:bold; color:${impactColor};">${co2} kg CO₂eq</span><br>
        📊 Dampak Lingkungan: <span style="font-weight:bold; color:${impactColor};">${impactLevel}</span><br>
        <div class="progress-bar-container"><div class="progress-bar" id="emissionBar"></div></div>
        <small style="color:#666;">* Data berdasarkan UK Government 2022</small>
      `;
      let barWidth = Math.min((co2 / 10) * 100, 100);
      document.getElementById('emissionBar').style.width = barWidth + '%';
      document.getElementById('emissionBar').style.backgroundColor = impactColor;
    });

    control.on('routingerror', () => showError('Gagal menemukan rute.'));
  } catch (err) { showError(err.message); }
});

// Clear route
document.getElementById('clearRouteButton').addEventListener('click', function() {
  if (control) { map.removeControl(control); control = null; }
  if (searchMarker) { map.removeLayer(searchMarker); searchMarker = null; }
  if (currentLocationMarker) { map.removeLayer(currentLocationMarker); currentLocationMarker = null; }
  startCoords = null; endCoords = null;
  document.getElementById('searchInput').value = '';
  document.getElementById('startInput').value = '';
  document.getElementById('endInput').value = '';
  document.getElementById('result').innerHTML = `
    <b>Info Perjalanan:</b><br>
    📏 Jarak: - <br>
    ⏱️ Estimasi Waktu: - <br>
    🌱 Emisi CO₂: - <br>
    📊 Dampak Lingkungan: -
  `;
  map.setView([2.1538651, 117.4970133], 12);
});
