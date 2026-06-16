/**
 * Klassenarbeits-Uhr Logik
 * Verwaltet die aktuelle Zeit, die Berechnung der Endzeit
 * und die Speicherung im LocalStorage.
 */

const currentTimeEl = document.getElementById('currentTime');
const inputStart = document.getElementById('inputStart');
const inputDuration = document.getElementById('inputDuration');
const displayStart = document.getElementById('displayStart');
const displayDuration = document.getElementById('displayDuration');
const displayEnd = document.getElementById('displayEnd');

/**
 * Aktualisiert die Anzeige der aktuellen Uhrzeit
 */
function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    currentTimeEl.textContent = `${hours}:${minutes}`;
}

/**
 * Speichert die vom Nutzer eingegebenen Daten
 */
function saveSettings() {
    const startTime = inputStart.value;
    const duration = parseInt(inputDuration.value);

    if (!startTime || isNaN(duration)) return;

    const examData = { startTime, duration };
    localStorage.setItem('examData', JSON.stringify(examData));
    
    applyData(startTime, duration);
}

/**
 * Berechnet das Ende und aktualisiert die Anzeige-Elemente
 */
function applyData(startTime, duration) {
    displayStart.textContent = startTime;
    displayDuration.innerHTML = `${duration} <span class="unit-text">min</span>`;

    // Endzeit berechnen
    const [hours, minutes] = startTime.split(':').map(Number);
    const endDate = new Date();
    endDate.setHours(hours);
    endDate.setMinutes(minutes + duration);

    const endH = String(endDate.getHours()).padStart(2, '0');
    const endM = String(endDate.getMinutes()).padStart(2, '0');
    
    displayEnd.textContent = `${endH}:${endM}`;
}

/**
 * Lädt gespeicherte Daten beim Seitenaufruf
 */
function loadSavedData() {
    const saved = localStorage.getItem('examData');
    const now = new Date();
    const currentFormatted = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    if (saved) {
        const { startTime, duration } = JSON.parse(saved);
        inputStart.value = startTime;
        inputDuration.value = duration;
        applyData(startTime, duration);
    } else {
        // Standardmäßig aktuelle Zeit als Start vorschlagen
        inputStart.value = currentFormatted;
    }
}

/**
 * Setzt alle Daten zurück
 */
function resetAll() {
    localStorage.removeItem('examData');
    
    // UI zurücksetzen
    inputDuration.value = '60';
    displayStart.textContent = '--:--';
    displayDuration.innerHTML = '-- <span class="unit-text">min</span>';
    displayEnd.textContent = '--:--';
    
    // Startzeit auf aktuelle Zeit setzen
    const now = new Date();
    inputStart.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

// Initialisierung
setInterval(updateClock, 1000);
updateClock();
loadSavedData();