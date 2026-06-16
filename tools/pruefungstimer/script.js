/**
 * Klassenarbeits-Uhr Logik
 * Verwaltet die aktuelle Zeit (inkl. Sekunden), die Berechnung von
 * Endzeit und verbleibender Zeit, und die Speicherung im LocalStorage.
 */

const currentTimeEl = document.getElementById('currentTime');
const inputStart = document.getElementById('inputStart');
const inputDuration = document.getElementById('inputDuration');
const displayStart = document.getElementById('displayStart');
const displayDuration = document.getElementById('displayDuration');
const displayEnd = document.getElementById('displayEnd');
const displayRemaining = document.getElementById('displayRemaining');

// Start- und Endzeitpunkt der Prüfung als Date-Objekte (oder null, wenn nicht gesetzt)
let examStart = null;
let examEnd = null;

/**
 * Aktualisiert die Anzeige der aktuellen Uhrzeit (HH:MM:SS)
 */
function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    currentTimeEl.textContent = `${hours}:${minutes}:${seconds}`;
}

/**
 * Aktualisiert die Anzeige der verbleibenden Zeit (HH:MM:SS).
 * Zeigt "--:--", solange die Prüfung noch nicht begonnen hat
 * oder die Zeit bereits abgelaufen ist.
 */
function updateRemaining() {
    if (!examStart || !examEnd) {
        displayRemaining.textContent = '--:--';
        return;
    }

    const now = new Date();

    if (now < examStart || now >= examEnd) {
        displayRemaining.textContent = '--:--';
        return;
    }

    const totalSeconds = Math.floor((examEnd - now) / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);

    displayRemaining.textContent =
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
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
 * Berechnet Ende und verbleibende Zeit und aktualisiert die Anzeige-Elemente
 */
function applyData(startTime, duration) {
    displayStart.textContent = startTime;
    displayDuration.innerHTML = `${duration} <span class="unit-text">min</span>`;

    const [hours, minutes] = startTime.split(':').map(Number);

    const start = new Date();
    start.setHours(hours, minutes, 0, 0);

    const end = new Date(start.getTime() + duration * 60000);

    examStart = start;
    examEnd = end;

    const endH = String(end.getHours()).padStart(2, '0');
    const endM = String(end.getMinutes()).padStart(2, '0');
    displayEnd.textContent = `${endH}:${endM}`;

    updateRemaining();
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
        examStart = null;
        examEnd = null;
        displayRemaining.textContent = '--:--';
    }
}

/**
 * Setzt alle Daten zurück
 */
function resetAll() {
    localStorage.removeItem('examData');

    examStart = null;
    examEnd = null;

    // UI zurücksetzen
    inputDuration.value = '60';
    displayStart.textContent = '--:--';
    displayDuration.innerHTML = '-- <span class="unit-text">min</span>';
    displayEnd.textContent = '--:--';
    displayRemaining.textContent = '--:--';

    // Startzeit auf aktuelle Zeit setzen
    const now = new Date();
    inputStart.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

// Initialisierung
setInterval(() => {
    updateClock();
    updateRemaining();
}, 1000);

updateClock();
updateRemaining();
loadSavedData();
