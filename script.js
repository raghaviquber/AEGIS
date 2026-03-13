let map, directionsService, directionsRenderer, placesService;
let userMarker, watchID, checkTimer;
let mediaRecorder, audioChunks = [];
let isRecording = false;

// 1. Navigation Flow
function showSetup() {
    document.getElementById("introScreen").style.transform = "translateY(-100%)";
    setTimeout(() => {
        document.getElementById("introScreen").classList.add("hidden");
        document.getElementById("setupScreen").classList.remove("hidden");
    }, 500);
}

function startNavigation() {
    const dest = document.getElementById("destInput").value;
    const p1 = document.getElementById("phone1").value;

    if (!dest || !p1) {
        alert("Please enter destination and contact number.");
        return;
    }

    document.getElementById("setupScreen").classList.add("hidden");
    document.getElementById("journeyScreen").classList.remove("hidden");

    initMap(dest);
}

// 2. Google Maps Logic
function initMap(destination) {
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        polylineOptions: {
            strokeColor: "#ff758c",
            strokeWeight: 6
        }
    });

    navigator.geolocation.getCurrentPosition(pos => {
        const myLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };

        map = new google.maps.Map(document.getElementById("map"), {
            center: myLocation,
            zoom: 15,
            disableDefaultUI: true,
            styles: pinkSoftStyle 
        });

        directionsRenderer.setMap(map);

        // Draw actual path line
        directionsService.route({
            origin: myLocation,
            destination: destination,
            travelMode: 'WALKING'
        }, (result, status) => {
            if (status === 'OK') {
                directionsRenderer.setDirections(result);
                // After route is loaded, find police along the path
                plotPoliceStations(result.routes[0].overview_path);
            } else {
                alert("Could not find a path to that destination.");
            }
        });

        // Current location dot
        userMarker = new google.maps.Marker({
            position: myLocation,
            map: map,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: "#ff0844",
                fillOpacity: 1,
                strokeColor: "white",
                strokeWeight: 2
            }
        });

        startGpsTracking();
        startSafetyCheckTimer();
    });
}

// 3. Real Police Detection (No Bluff)
function plotPoliceStations(pathPoints) {
    placesService = new google.maps.places.PlacesService(map);
    
    // Check start, middle, and end of the route for police
    const searchLocations = [
        pathPoints[0], 
        pathPoints[Math.floor(pathPoints.length / 2)], 
        pathPoints[pathPoints.length - 1]
    ];

    searchLocations.forEach(loc => {
        const request = {
            location: loc,
            radius: '1500',
            type: ['police']
        };

        placesService.nearbySearch(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                results.forEach(place => {
                    new google.maps.Marker({
                        position: place.geometry.location,
                        map: map,
                        title: place.name,
                        icon: "https://maps.google.com/mapfiles/kml/paddle/police.png"
                    });
                });
            }
        });
    });
}

function findPolice() {
    alert("Scanning area for nearest police help...");
    plotPoliceStations([map.getCenter()]);
}

// 4. Audio Evidence Recording
async function toggleRecording() {
    const btn = document.getElementById("recBtn");
    const indicator = document.getElementById("recIndicator");

    if (!isRecording) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunks, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "AEGIS_Evidence.webm";
                a.click(); // Automatically "saves" to device
            };

            mediaRecorder.start();
            isRecording = true;
            btn.innerText = "🛑 Stop Recording";
            indicator.style.display = "block";
        } catch (err) {
            alert("Mic permission denied!");
        }
    } else {
        mediaRecorder.stop();
        isRecording = false;
        btn.innerText = "🎙 Start Recording";
        indicator.style.display = "none";
        alert("Recording saved as Evidence.");
    }
}

// 5. Emergency SOS (Real SMS Protocol)
function triggerSOS() {
    const phone = document.getElementById("phone1").value;
    const lat = userMarker.getPosition().lat();
    const lng = userMarker.getPosition().lng();
    const msg = `EMERGENCY! I feel unsafe. Track me: https://www.google.com/maps?q=${lat},${lng}`;

    window.location.href = `sms:${phone}?body=${encodeURIComponent(msg)}`;
    alert("Opening Messaging App... Send the prepared SOS!");
}

function fakeCall() {
    alert("📞 INCOMING CALL: 'Dad'\n'Hey, I'm watching your live location. Keep walking.'");
}

function startGpsTracking() {
    watchID = navigator.geolocation.watchPosition(pos => {
        const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        userMarker.setPosition(newPos);
    });
}

function startSafetyCheckTimer() {
    const interval = parseInt(document.getElementById("timerVal").value);
    checkTimer = setInterval(() => {
        const safe = confirm("AEGIS SAFETY CHECK: Are you okay? (Clicking CANCEL triggers SOS)");
        if (!safe) triggerSOS();
    }, interval);
}

// Custom Pink Style for Map
const pinkSoftStyle = [
    { "featureType": "water", "stylers": [{ "color": "#eafbff" }] },
    { "featureType": "road", "stylers": [{ "color": "#ffffff" }] },
    { "featureType": "landscape", "stylers": [{ "color": "#fdf1f3" }] }
];