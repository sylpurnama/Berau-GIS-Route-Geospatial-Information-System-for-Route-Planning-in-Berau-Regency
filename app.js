<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sistem Informasi Geospasial Rute Perjalanan</title>
  
  <!-- Leaflet CSS -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet-routing-machine/dist/leaflet-routing-machine.css" />

  <style>
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      display: flex;
      flex-direction: column;
      height: 100vh;
    }

    .header {
      display: flex;
      justify-content: space-between; /* kiri dan kanan */
      align-items: center;
      background-color: #2c3e50;
      color: white;
      padding: 12px 20px;
    }

    .left-header {
      display: flex; 
      align-items: center;
      gap: 10px;
    }
    
    .logo img {
     height: 50px;
    }

    .institution-text {
      font-size: 14px;
      font-weight: bold;     /* tebal */
      text-align: right;
      max-width: 600px;      /* agar tetap rapi */
      line-height: 1.3;
    }

    .system-title {
      font-size: 18px;       /* lebih besar */
      font-weight: bold;     /* tebal */
      text-align: right;
      max-width: 600px;      /* agar tetap rapi */
      line-height: 1.4;      /* spasi antar baris */
}

    .app-title {
      text-align: center;
      padding: 10px;
      font-weight: bold;
      background-color: #e6f2ff;
    }

    #map {
      flex: 1;
      width: 100%;
    }

    .search-container {
  position: absolute;
  top: 120px;
  right: 20px;   /* ubah dari left ke right */
  max-width: 300px;
  background-color: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  z-index: 1000;
  font-size: 14px;
}

    .search-box {
      margin-bottom: 10px;
    }

    .search-box label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }

    .search-input, select {
      width: 100%;
      padding: 6px 5px;
      margin-bottom: 5px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }

    button {
      padding: 8px 12px;
      margin: 5px 0;
      cursor: pointer;
      background-color: #0066cc;
      color: white;
      border: none;
      border-radius: 4px;
      width: 100%;
    }

    button:hover {
      background-color: #0052a3;
    }

    .result-box {
      margin-top: 10px;
      padding: 10px;
      background-color: #f9f9f9;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 13px;
    }

    .loading {
      color: #666;
      font-style: italic;
    }

    .error {
      background-color: #f2d9d9;
      border: 1px solid #d9b3b3;
      color: #cc0000;
    }

    /* Progress bar untuk emisi */
    .progress-bar-container {
      width: 100%;
      background-color: #eee;
      border-radius: 6px;
      margin-top: 6px;
      height: 14px;
      overflow: hidden;
    }

    .progress-bar {
      height: 100%;
      width: 0%;
      border-radius: 6px;
      transition: width 0.5s ease, background-color 0.5s ease;
    }
  </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
      <!-- Kiri: Logo + Institusi -->
      <div class="left-header">
        <div class="logo">
          <img src="https://polteksimasberau.ac.id/wp-content/uploads/2025/03/Logo-Poltek-Simas-Berau-Compress.webp" alt="Logo PSB"/>
        </div>
        <div class="institution-text">
          <b>Politeknik Sinar Mas Berau Coal</b><br>
          Program Studi Survei dan Pemetaan
        </div>
      </div>
  
      <!-- Kanan: Judul Sistem -->
      <div class="system-title">
        Berau GIS Route: Geospatial Information System for Route Planning <br>
        with Carbon Footprint Analysis in Berau Regency
      </div>
    </div>
  </body>
  

   <!-- Peta -->
  <div id="map"></div>

  <!-- Sidebar -->
  <div class="search-container">
    <div class="search-box">
      <label for="searchInput">Search Location</label>
      <input type="text" id="searchInput" class="search-input" placeholder="Masukkan lokasi di Berau...">
      <button id="searchButton">Search</button>
    </div>
    <hr>
    <div class="search-box">
      <label for="startInput">Start Location</label>
      <input type="text" id="startInput" class="search-input" placeholder="Masukkan asal (opsional)">
      <button id="useCurrentButton">Gunakan Posisi Saat Ini</button>
    </div>
    <div class="search-box">
      <label for="endInput">End Location</label>
      <input type="text" id="endInput" class="search-input" placeholder="Masukkan tujuan (Berau)">
    </div>
    <div class="search-box">
      <label for="vehicleSelect">Pilih Kendaraan</label>
      <select id="vehicleSelect">
        <option value="0.114">Sepeda Motor (0.114 kg CO₂eq/km)</option>
        <option value="0.170">Mobil Bensin (0.170 kg CO₂eq/km)</option>
        <option value="0.171">Mobil Diesel (0.171 kg CO₂eq/km)</option>
        <option value="0.047">Mobil Listrik (0.047 kg CO₂eq/km)</option>
        <option value="0.097">Bus (0.097 kg CO₂eq/km)</option>
        <option value="0.200">Truk Kecil (0.200 kg CO₂eq/km)</option>
        <option value="0.350">Truk Besar (0.350 kg CO₂eq/km)</option>
      </select>
    </div>
    <button id="routeButton">Find Route</button>
    <button id="clearRouteButton">Clear Route</button>

    <div id="result" class="result-box">
      <b>Info Perjalanan:</b><br>
      📏 Jarak: - <br>
      ⏱️ Estimasi Waktu: - <br>
      🌱 Emisi CO₂: - <br>
      📊 Dampak Lingkungan: -
    </div>
  </div>

  <!-- Script -->
  <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
  <script src="https://unpkg.com/leaflet-routing-machine/dist/leaflet-routing-machine.js"></script>
  <script>
    // Inisialisasi peta
    var map = L.map('map').setView([2.1538651, 117.4970133], 12);

    // Tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    var control;
    var currentLocationMarker;
    var searchMarker;
    var startCoords = null;
    var endCoords = null;

    // Fungsi geocoding
    async function geocodeLocation(locationName) {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName + ', Berau, Kalimantan Timur')}&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          display_name: data[0].display_name
        };
      } else {
        throw new Error('Lokasi tidak ditemukan');
      }
    }

    function showLoading(message) {
      document.getElementById('result').innerHTML = `<span class="loading">${message}</span>`;
    }

    function showError(message) {
      document.getElementById('result').innerHTML = `<span class="error">${message}</span>`;
      document.getElementById('result').className = 'result-box error';
      setTimeout(() => {
        document.getElementById('result').className = 'result-box';
      }, 3000);
    }

    // Search lokasi
    document.getElementById('searchButton').addEventListener('click', async function() {
      const searchQuery = document.getElementById('searchInput').value.trim();
      if (!searchQuery) { alert('Masukkan nama lokasi!'); return; }
      showLoading('Mencari lokasi...');
      try {
        const location = await geocodeLocation(searchQuery);
        if (searchMarker) map.removeLayer(searchMarker);
        searchMarker = L.marker([location.lat, location.lng])
          .addTo(map)
          .bindPopup(`<b>Lokasi Ditemukan:</b><br>${location.display_name}`)
          .openPopup();
        map.setView([location.lat, location.lng], 15);
        document.getElementById('result').innerHTML = `
          <b>Lokasi Ditemukan:</b><br>
          ${location.display_name}<br>
          Koordinat: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}
        `;
      } catch (error) { showError(error.message); }
    });

    // Gunakan posisi saat ini
    document.getElementById('useCurrentButton').addEventListener('click', function() {
      if (!navigator.geolocation) { showError('Geolocation tidak didukung'); return; }
      showLoading('Mendapatkan posisi...');
      navigator.geolocation.getCurrentPosition(
        function(position) {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          startCoords = [lat, lng];
          if (currentLocationMarker) map.removeLayer(currentLocationMarker);
          currentLocationMarker = L.marker([lat, lng])
            .addTo(map)
            .bindPopup('<b>Posisi Anda Saat Ini</b>')
            .openPopup();
          document.getElementById('startInput').value = `Posisi Saat Ini (${lat.toFixed(6)}, ${lng.toFixed(6)})`;
          map.setView([lat, lng], 15);
          document.getElementById('result').innerHTML = `
            <b>Posisi Saat Ini:</b><br>
            Latitude: ${lat.toFixed(6)}<br>
            Longitude: ${lng.toFixed(6)}
          `;
        },
        function(error) { showError('Gagal mendapatkan posisi'); },
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
          const routeBounds = L.latLngBounds(route.coordinates);
          map.fitBounds(routeBounds);
          const distance = (route.summary.totalDistance / 1000).toFixed(2);
          const timeMinutes = Math.round(route.summary.totalTime / 60);
          const timeHours = Math.floor(timeMinutes / 60);
          const remainingMinutes = timeMinutes % 60;
          const co2 = (distance * vehicleFactor).toFixed(3);
          let timeDisplay = (timeHours > 0) ? `${timeHours} jam ${remainingMinutes} menit` : `${timeMinutes} menit`;
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
          let impactLevel = '', impactColor = '';
          if (co2 < 1) { impactLevel = 'Rendah'; impactColor = '#4CAF50'; }
          else if (co2 < 5) { impactLevel = 'Sedang'; impactColor = '#FF9800'; }
          else { impactLevel = 'Tinggi'; impactColor = '#F44336'; }
          
          document.getElementById('result').innerHTML = `
            <b>Info Perjalanan (${vehicleType}):</b><br>
            📏 Jarak: ${distance} km <br>
            ⏱️ Estimasi Waktu: ${timeDisplay} <br>
            🌱 Emisi CO₂: <span style="font-weight:bold; color:${impactColor};">${co2} kg CO₂eq</span><br>
            📊 Dampak Lingkungan: <span style="font-weight:bold; color:${impactColor};">${impactLevel}</span><br>
            <div class="progress-bar-container"><div class="progress-bar" id="emissionBar"></div></div>
            <small style="color: #666;">* Data berdasarkan UK Government 2022</small>
          `;
          let barWidth = Math.min((co2 / 10) * 100, 100);
          document.getElementById('emissionBar').style.width = barWidth + '%';
          document.getElementById('emissionBar').style.backgroundColor = impactColor;
        });

        control.on('routingerror', function(e) { showError('Gagal menemukan rute.'); });
      } catch (error) { showError(error.message); }
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
  </script>
</body>
</html>
