// Import Firebase SDKs
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, signInAnonymously } from "firebase/auth";
import {
    getFirestore,
    collection,
    addDoc,
    onSnapshot,
    query,
    orderBy,
    limit,
    serverTimestamp
} from "firebase/firestore";



// Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Roboflow and Google Maps configuration
const appConfig = {
    roboflow: {
        apiKey: import.meta.env.VITE_ROBOFLOW_API_KEY,
        modelId: import.meta.env.VITE_ROBOFLOW_MODEL_ID || "fmy-first-project-ulnpd",
        version: import.meta.env.VITE_ROBOFLOW_MODEL_VERSION || 1
    },
    googleMaps: {
        apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    }
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Global variables
let map;
let markers = new Map();
let currentLocation = null;
let currentLocationMarker;
let watchId = null;
let isFirebaseConnected = false;
let unsubscribePins = null;
let mapInitialized = false;
let currentUser = null;
let currentPredictions = null;
let previewCanvasScale = 1;

const CONFIDENCE_THRESHOLD = 0.5;
const PIN_THROTTLE_INTERVAL = 30000;
const lastPinTime = new Map();

// Color system functions
function getPinColorByAge(timestamp) {
    const now = new Date();
    let pinDate;

    // Handle different timestamp formats
    if (!timestamp) {
        // If no timestamp, treat as just created (red)
        pinDate = now;
    } else if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        // Firestore Timestamp object
        pinDate = timestamp.toDate();
    } else if (timestamp.seconds) {
        // Firestore Timestamp-like object
        pinDate = new Date(timestamp.seconds * 1000);
    } else if (timestamp instanceof Date) {
        // Already a Date object
        pinDate = timestamp;
    } else if (typeof timestamp === 'number') {
        // Unix timestamp
        pinDate = new Date(timestamp);
    } else if (typeof timestamp === 'string') {
        // String date
        pinDate = new Date(timestamp);
    } else {
        // Fallback: treat as just created
        console.warn('Unknown timestamp format:', timestamp);
        pinDate = now;
    }

    const ageMinutes = Math.floor((now - pinDate) / (1000 * 60));

    // Ensure we don't get negative ages (future timestamps)
    const safeAge = Math.max(0, ageMinutes);

    // Define color transitions based on age
    if (safeAge <= 5) {
        return '#FF0000'; // Bright red - very recent
    } else if (safeAge <= 10) {
        return '#FF4500'; // Orange red
    } else if (safeAge <= 20) {
        return '#FF8C00'; // Dark orange
    } else if (safeAge <= 40) {
        return '#FFD700'; // Gold
    } else if (safeAge <= 60) {
        return '#9ACD32'; // Yellow green
    } else if (safeAge <= 120) {
        return '#00CED1'; // Dark turquoise
    } else {
        return '#0000FF'; // Blue - oldest
    }
}

function createColoredMarkerIcon(color) {
    return {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: color,
        fillOpacity: 0.9,
        strokeWeight: 3,
        strokeColor: '#FFFFFF',
        strokeOpacity: 1
    };
}

function updateAllPinColors() {
    markers.forEach((markerData, pinId) => {
        const { marker, timestamp } = markerData;
        const newColor = getPinColorByAge(timestamp);
        marker.setIcon(createColoredMarkerIcon(newColor));
    });
}

function addColorLegend() {
    const legend = document.createElement('div');
    legend.id = 'color-legend';

    legend.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 8px;">Pin Age Legend</div>
        <div><span style="color: #FF0000;">●</span> 0-5 min</div>
        <div><span style="color: #FF4500;">●</span> 5-10 min</div>
        <div><span style="color: #FF8C00;">●</span> 10-20 min</div>
        <div><span style="color: #FFD700;">●</span> 20-40 min</div>
        <div><span style="color: #9ACD32;">●</span> 40-60 min</div>
        <div><span style="color: #00CED1;">●</span> 1-2 hours</div>
        <div><span style="color: #0000FF;">●</span> 2+ hours</div>
    `;

    document.body.appendChild(legend);
}

function initializeColorSystem() {
    // Add the legend
    addColorLegend();

    // Update pin colors every minute
    setInterval(updateAllPinColors, 60000);

    console.log("Time-based pin color system initialized");
}

// Initialize the app
async function initializeApplication() {
    try {
        console.log("Starting application initialization");

        document.getElementById('loading-spinner').style.display = 'none';
        document.getElementById('map').style.display = 'block';
        document.getElementById('open-camera').style.display = 'block';
        document.getElementById('location-status').style.display = 'block';
        document.getElementById('connection-status').style.display = 'block';

        setupEventListeners();
        requestLocation();
        await initFirebase();
        await loadGoogleMapsAPI();
        initializeColorSystem();

        console.log("Application initialized successfully");
    } catch (error) {
        console.error("Failed to initialize app:", error);
        showErrorMessage("Failed to initialize application: " + error.message);
    }
}

async function initFirebase() {
    try {
        const userCredential = await signInAnonymously(auth);
        currentUser = userCredential.user;
        console.log(`Authentication successful: ${currentUser.uid}`);
        updateConnectionStatus('firebase', true);
        isFirebaseConnected = true;
        startListening();
    } catch (error) {
        console.error("Firebase auth error:", error);
        updateConnectionStatus('firebase', false);

        if (error.code === 'auth/operation-not-allowed') {
            showErrorMessage("Anonymous authentication is not enabled in Firebase Console");
        } else {
            showErrorMessage("Authentication failed: " + error.message);
        }
    }
}

function startListening() {
    if (!isFirebaseConnected) return;

    try {
        const pinsQuery = query(
            collection(db, "pins"),
            orderBy("timestamp", "desc"),
            limit(100)
        );

        unsubscribePins = onSnapshot(pinsQuery, (snapshot) => {
            console.log(`Received ${snapshot.docs.length} pins from Firestore`);

            snapshot.docChanges().forEach(change => {
                const data = change.doc.data();
                const id = change.doc.id;

                if (change.type === "added") {
                    addPinToMap(id, data);
                } else if (change.type === "removed") {
                    removePinFromMap(id);
                }
            });
        }, error => {
            console.error("Firestore listener error:", error);
            updateConnectionStatus('firebase', false);
        });

    } catch (error) {
        console.error("Firebase listen setup error:", error);
        updateConnectionStatus('firebase', false);
    }
}

function requestLocation() {
    const locationStatus = document.getElementById('location-status');

    if (!navigator.geolocation) {
        locationStatus.innerHTML = "Location: Not Available";
        locationStatus.className = 'status-error';
        return;
    }

    const options = {
        enableHighAccuracy: true,
        maximumAge: 60000,
        timeout: 15000
    };

    navigator.geolocation.getCurrentPosition(
        handleLocationUpdate,
        handleLocationError,
        options
    );

    watchId = navigator.geolocation.watchPosition(
        handleLocationUpdate,
        handleLocationError,
        options
    );
}

function handleLocationUpdate(position) {
    const { latitude, longitude, accuracy } = position.coords;
    currentLocation = { lat: latitude, lng: longitude };

    const locationStatus = document.getElementById('location-status');
    locationStatus.innerHTML = `Location: Active (±${Math.round(accuracy)}m)`;
    locationStatus.className = 'status-good';

    if (mapInitialized) {
        updateLocationMarker(latitude, longitude);
    }
}

function handleLocationError(error) {
    const locationStatus = document.getElementById('location-status');
    let message = "Location: ";

    switch (error.code) {
        case error.PERMISSION_DENIED:
            message += "Permission Denied";
            break;
        case error.POSITION_UNAVAILABLE:
            message += "Position Unavailable";
            break;
        case error.TIMEOUT:
            message += "Timeout";
            break;
        default:
            message += "Unknown Error";
            break;
    }

    locationStatus.innerHTML = message;
    locationStatus.className = 'status-error';
}

function setupEventListeners() {
    document.getElementById('open-camera').addEventListener('click', openCamera);
    document.getElementById('close-camera').addEventListener('click', closeCamera);
    document.getElementById('capture-button').addEventListener('click', captureAndAnalyze);
    document.getElementById('close-preview').addEventListener('click', closePreview);
    document.getElementById('camera-button').addEventListener('click', goToCamera);
    document.getElementById('continue-button').addEventListener('click', continueFromPreview);
}

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const detectionStatus = document.getElementById('detection-status');
const previewCanvas = document.getElementById('preview-canvas');
const previewStatus = document.getElementById('preview-status');

function openCamera() {
    if (!currentLocation) {
        showErrorMessage("Location required for camera usage");
        return;
    }

    document.getElementById('camera-container').style.display = 'block';
    startVideoStream();
}

function closeCamera() {
    stopVideoStream();
    document.getElementById('camera-container').style.display = 'none';
    detectionStatus.innerText = "";
}

function closePreview() {
    document.getElementById('image-preview-container').style.display = 'none';
    document.getElementById('camera-container').style.display = 'block';
    currentPredictions = null;
    clearPredictionOverlays();
}

function continueFromPreview() {
    // Close preview and camera completely, return to map
    document.getElementById('image-preview-container').style.display = 'none';
    closeCamera();
}

function goToCamera() {
    // Go back to live camera view from preview
    document.getElementById('image-preview-container').style.display = 'none';
    document.getElementById('camera-container').style.display = 'block';
    currentPredictions = null;
    clearPredictionOverlays();
}

function startVideoStream() {
    const constraints = {
        video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
        }
    };

    navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
            video.srcObject = stream;
            detectionStatus.innerText = "Camera ready - Point at objects to detect";
        })
        .catch(error => {
            console.error("Camera error:", error);
            detectionStatus.innerText = "Camera access denied. Please grant camera permission.";
        });
}

function stopVideoStream() {
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }
}

function captureAndAnalyze() {
    if (!video.srcObject?.active) {
        detectionStatus.innerText = "No camera feed available";
        return;
    }

    if (!currentLocation) {
        detectionStatus.innerText = "Location required for pin placement";
        return;
    }

    // Capture the image
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Show preview
    showImagePreview();

    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    const base64 = imageData.split(',')[1];

    // Show analyzing indicator
    document.getElementById('analyzing-indicator').style.display = 'block';

    analyzeWithRoboflow(base64);
}

function showImagePreview() {
    // Hide camera view
    document.getElementById('camera-container').style.display = 'none';

    // Show preview
    document.getElementById('image-preview-container').style.display = 'block';

    // Copy canvas content to preview canvas
    const previewCtx = previewCanvas.getContext('2d');
    const containerRect = document.getElementById('image-preview-container').getBoundingClientRect();

    // Calculate dimensions to maintain aspect ratio
    const imageAspect = canvas.width / canvas.height;
    const containerAspect = containerRect.width / containerRect.height;

    let drawWidth, drawHeight;
    if (imageAspect > containerAspect) {
        drawWidth = containerRect.width;
        drawHeight = containerRect.width / imageAspect;
    } else {
        drawWidth = containerRect.height * imageAspect;
        drawHeight = containerRect.height;
    }

    previewCanvas.width = drawWidth;
    previewCanvas.height = drawHeight;
    previewCanvasScale = Math.min(drawWidth / canvas.width, drawHeight / canvas.height);

    previewCtx.drawImage(canvas, 0, 0, drawWidth, drawHeight);

    previewStatus.innerHTML = "Analyzing image...";
    previewStatus.className = 'status-loading';
}

function analyzeWithRoboflow(base64) {
    if (!appConfig?.roboflow) {
        previewStatus.innerText = "Roboflow configuration not available";
        previewStatus.className = 'status-error';
        document.getElementById('analyzing-indicator').style.display = 'none';
        return;
    }

    const { apiKey, modelId, version } = appConfig.roboflow;
    const url = `https://detect.roboflow.com/${modelId}/${version}?api_key=${apiKey}&name=capture.jpg`;

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: base64
    })
        .then(response => response.json())
        .then(data => {
            handleDetectionResults(data);
            updateConnectionStatus('roboflow', true);
            document.getElementById('analyzing-indicator').style.display = 'none';
        })
        .catch(error => {
            console.error("Roboflow error:", error);
            previewStatus.innerText = "Detection failed: " + error.message;
            previewStatus.className = 'status-error';
            updateConnectionStatus('roboflow', false);
            document.getElementById('analyzing-indicator').style.display = 'none';
        });
}

async function handleDetectionResults(data) {
    const predictions = data.predictions || [];
    currentPredictions = predictions;

    console.log("Raw predictions:", predictions);

    // Clear existing overlays
    clearPredictionOverlays();

    if (predictions.length === 0) {
        previewStatus.innerHTML = "No objects detected - No pins created";
        previewStatus.className = 'status-error';
        return;
    }

    // Filter valid predictions (above confidence threshold)
    let validPredictions = predictions.filter(p => p.confidence >= CONFIDENCE_THRESHOLD);

    console.log("Valid predictions:", validPredictions);

    if (validPredictions.length === 0) {
        previewStatus.innerHTML = `${predictions.length} objects detected but confidence too low (need > ${CONFIDENCE_THRESHOLD * 100}%) - No pins created`;
        previewStatus.className = 'status-error';
        // Draw all predictions for debugging
        predictions.forEach(prediction => {
            drawPredictionOverlay(prediction, false, false);
        });
        return;
    }

    // Count objects by category
    const objectCounts = {};
    validPredictions.forEach(p => {
        objectCounts[p.class] = (objectCounts[p.class] || 0) + 1;
    });

    console.log("Object counts:", objectCounts);

    // Find categories with 2+ detections
    const categoriesToPin = Object.entries(objectCounts)
        .filter(([category, count]) => count >= 2);

    console.log("Categories to pin:", categoriesToPin);

    // Draw ALL predictions for debugging
    predictions.forEach(prediction => {
        const isValidConfidence = prediction.confidence >= CONFIDENCE_THRESHOLD;
        const willCreatePin = isValidConfidence && (objectCounts[prediction.class] || 0) >= 2;
        drawPredictionOverlay(prediction, isValidConfidence, willCreatePin);
    });

    // Automatically create pins for categories with 2+ detections
    let pinsCreated = 0;
    for (const [category, count] of categoriesToPin) {
        // Find best prediction for this category
        const bestPrediction = validPredictions
            .filter(p => p.class === category)
            .reduce((best, current) => current.confidence > best.confidence ? current : best);

        console.log(`Creating pin for ${category} with best prediction:`, bestPrediction);

        // Create pin automatically
        try {
            await createPinAutomatically(bestPrediction, count);
            pinsCreated++;
            console.log(`Successfully created pin for ${category} (${count} objects detected)`);
        } catch (error) {
            console.error(`Failed to create pin for ${category}:`, error);
        }
    }

    // Update status message
    const totalValidObjects = validPredictions.length;
    const categoriesDetected = Object.keys(objectCounts).length;

    if (pinsCreated > 0) {
        previewStatus.innerHTML = `Analysis complete: ${totalValidObjects} objects detected across ${categoriesDetected} categories. ${pinsCreated} pins created automatically.`;
        previewStatus.className = 'status-good';
    } else {
        previewStatus.innerHTML = `Analysis complete: ${totalValidObjects} objects detected but no category has 2+ objects. No pins created.`;
        previewStatus.className = 'status-error';
    }
}

function drawPredictionOverlay(prediction, isValidConfidence = true, willCreatePin = false) {
    const overlay = document.getElementById('predictions-overlay');

    // Create prediction box
    const box = document.createElement('div');
    box.className = 'prediction-box';

    // Calculate position and size based on canvas dimensions and scale
    const left = (prediction.x - prediction.width / 2) * previewCanvasScale;
    const top = (prediction.y - prediction.height / 2) * previewCanvasScale;
    const width = prediction.width * previewCanvasScale;
    const height = prediction.height * previewCanvasScale;

    box.style.left = left + 'px';
    box.style.top = top + 'px';
    box.style.width = width + 'px';
    box.style.height = height + 'px';

    // Style based on confidence and pin creation status
    if (!isValidConfidence) {
        // Low confidence - gray styling
        box.style.borderColor = '#95a5a6';
        box.style.backgroundColor = 'rgba(149, 165, 166, 0.2)';
    } else if (willCreatePin) {
        // Will create pin - green styling
        box.style.borderColor = '#2ecc71';
        box.style.backgroundColor = 'rgba(46, 204, 113, 0.2)';
    } else {
        // Valid but won't create pin - default red styling
        box.style.borderColor = '#e74c3c';
        box.style.backgroundColor = 'rgba(231, 76, 60, 0.2)';
    }

    // Create label
    const label = document.createElement('div');
    label.className = 'prediction-label';

    if (!isValidConfidence) {
        label.style.backgroundColor = '#95a5a6';
        label.textContent = `${prediction.class} (${Math.round(prediction.confidence * 100)}%) - LOW CONFIDENCE`;
    } else if (willCreatePin) {
        label.style.backgroundColor = '#2ecc71';
        label.textContent = `${prediction.class} (${Math.round(prediction.confidence * 100)}%) - PIN CREATED`;
    } else {
        label.style.backgroundColor = '#e74c3c';
        label.textContent = `${prediction.class} (${Math.round(prediction.confidence * 100)}%) - NO PIN`;
    }

    box.appendChild(label);
    overlay.appendChild(box);
}

function clearPredictionOverlays() {
    const overlay = document.getElementById('predictions-overlay');
    overlay.innerHTML = '';
}

async function createPinAutomatically(prediction, objectCount) {
    const now = Date.now();

    if (shouldThrottlePin(prediction.class, now)) {
        console.log(`Pin for ${prediction.class} throttled (30s cooldown)`);
        return;
    }

    if (!currentUser?.uid) {
        console.error("User not authenticated for pin creation");
        return;
    }

    const pinData = {
        objectName: prediction.class,
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
        confidence: prediction.confidence,
        // DON'T store objectCount in the database - for internal use only
        userId: currentUser.uid,
        timestamp: serverTimestamp()
    };

    console.log("Creating pin with data:", pinData);

    try {
        if (isFirebaseConnected) {
            await saveToFirebase(pinData);
            lastPinTime.set(prediction.class, now);
            console.log(`Pin created automatically for ${prediction.class} (${objectCount} objects detected)`);
        } else {
            console.error("Firebase connection required to save pins");
        }
    } catch (error) {
        console.error("Auto-save error:", error);
        throw error;
    }
}

function shouldThrottlePin(objectName, now) {
    const lastTime = lastPinTime.get(objectName);
    return lastTime && (now - lastTime) < PIN_THROTTLE_INTERVAL;
}

async function saveToFirebase(pinData) {
    try {
        const docRef = await addDoc(collection(db, "pins"), pinData);
        console.log("Pin saved successfully:", docRef.id);
    } catch (error) {
        console.error("Firestore save error:", error);
        throw error;
    }
}

function updateLocationMarker(lat, lng) {
    if (!map || !mapInitialized) return;

    const position = { lat: lat, lng: lng };

    if (currentLocationMarker) {
        currentLocationMarker.setPosition(position);
    } else {
        currentLocationMarker = new google.maps.Marker({
            position: position,
            map: map,
            title: 'Your Location',
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#3498db',
                fillOpacity: 1,
                strokeWeight: 3,
                strokeColor: '#ffffff'
            }
        });

        map.setCenter(position);
        map.setZoom(16);
    }
}

function addPinToMap(pinId, pinData) {
    if (!map || !mapInitialized || markers.has(pinId)) {
        return;
    }

    let position;
    if (pinData.latitude !== undefined && pinData.longitude !== undefined) {
        position = { lat: pinData.latitude, lng: pinData.longitude };
    } else if (pinData.location?.lat !== undefined) {
        position = { lat: pinData.location.lat, lng: pinData.location.lng };
    } else {
        return;
    }

    // Get color based on pin age
    const pinColor = getPinColorByAge(pinData.timestamp);

    const marker = new google.maps.Marker({
        position: position,
        map: map,
        title: pinData.objectName,
        icon: createColoredMarkerIcon(pinColor),
        animation: google.maps.Animation.DROP
    });

    const date = pinData.timestamp?.toDate ? pinData.timestamp.toDate() : new Date();
    const timeAgo = formatTimeAgo(date);
    const ageMinutes = Math.floor((new Date() - date) / (1000 * 60));

    // Enhanced info window with age indicator (NO object count displayed)
    const infoWindow = new google.maps.InfoWindow({
        content: `
            <div style="color: black;">
                <b>Detection Pin</b><br>
                Object: 🔍 ${pinData.objectName}<br>
                ${pinData.confidence ? `Confidence: ${Math.round(pinData.confidence * 100)}%<br>` : ''}
                Time: ${timeAgo}<br>
                Age: <span style="color: ${pinColor}; font-weight: bold;">${ageMinutes} minutes</span><br>
                User: ${pinData.userId ? pinData.userId.substring(0, 8) + '...' : 'Unknown'}
            </div>
        `
    });

    marker.addListener('click', () => {
        infoWindow.open(map, marker);
    });

    markers.set(pinId, { marker, timestamp: pinData.timestamp });
}

function removePinFromMap(pinId) {
    if (markers.has(pinId)) {
        const { marker } = markers.get(pinId);
        marker.setMap(null);
        markers.delete(pinId);
    }
}

function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
}

function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerText = message;
    document.body.appendChild(errorDiv);

    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'error-message';
    successDiv.style.backgroundColor = 'rgba(46, 204, 113, 0.9)';
    successDiv.innerText = message;
    document.body.appendChild(successDiv);

    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

function updateConnectionStatus(service, isConnected) {
    const statusDiv = document.getElementById(`${service}-status`);
    if (statusDiv) {
        statusDiv.innerHTML = `${service.charAt(0).toUpperCase() + service.slice(1)}: ${isConnected ? 'Connected' : 'Disconnected'}`;
        statusDiv.style.color = isConnected ? '#2ecc71' : '#e74c3c';
    }
}

async function loadGoogleMapsAPI() {
    if (!appConfig?.googleMaps) {
        showErrorMessage("Google Maps configuration not available");
        return;
    }

    if (window.google?.maps) {
        window.initMap();
        return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${appConfig.googleMaps.apiKey}&callback=initMap`;
    script.async = true;
    script.defer = true;

    script.onerror = () => {
        showErrorMessage("Failed to load Google Maps");
    };

    document.head.appendChild(script);
}

window.initMap = function () {
    const mapOptions = {
        zoom: 13,
        center: { lat: 48.8566, lng: 2.3522 },
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: []
    };

    try {
        map = new google.maps.Map(document.getElementById('map'), mapOptions);
        mapInitialized = true;
        console.log("Google Maps initialized successfully");

        if (currentLocation) {
            updateLocationMarker(currentLocation.lat, currentLocation.lng);
        }
    } catch (error) {
        console.error("Map initialization error:", error);
        showErrorMessage("Failed to initialize map");
    }
};

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeApplication();
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden && video.srcObject?.active) {
        stopVideoStream();
    }
});

// Handle window resize to recalculate overlay positions
window.addEventListener('resize', () => {
    if (document.getElementById('image-preview-container').style.display !== 'none' && currentPredictions) {
        setTimeout(() => {
            clearPredictionOverlays();
            if (currentPredictions) {
                // Recalculate object counts for proper styling
                const validPredictions = currentPredictions.filter(p => p.confidence >= CONFIDENCE_THRESHOLD);
                const objectCounts = {};
                validPredictions.forEach(p => {
                    objectCounts[p.class] = (objectCounts[p.class] || 0) + 1;
                });

                currentPredictions.forEach(prediction => {
                    const isValidConfidence = prediction.confidence >= CONFIDENCE_THRESHOLD;
                    const willCreatePin = isValidConfidence && (objectCounts[prediction.class] || 0) >= 2;
                    drawPredictionOverlay(prediction, isValidConfidence, willCreatePin);
                });
            }
        }, 100);
    }
});
