/**
 * Prüfungs-Uhr
 *
 * Zeigt die aktuelle Uhrzeit sowie Anfang, Dauer, verbleibende Zeit und
 * geplantes Ende einer Prüfung. Die Prüfung wird im localStorage gesichert,
 * damit sie ein versehentliches Neuladen der Seite übersteht.
 */
(() => {
    'use strict';

    // ---------- Einstellungen ----------

    /** Schlüssel im localStorage. Mit Präfix, weil sich alle Seiten unter
     *  derselben github.io-Adresse einen gemeinsamen Speicher teilen. */
    const STORAGE_KEY = 'pruefungsuhr.exam';
    /** Schlüssel der früheren Fassung (nur Uhrzeit ohne Datum) – wird entfernt. */
    const LEGACY_STORAGE_KEY = 'examData';

    const EXTEND_MINUTES = 5;
    const DEFAULT_DURATION = 60;
    /** Größte zulässige Dauer in Minuten; muss zum max-Attribut im HTML passen. */
    const MAX_DURATION = 720;
    /** So lange nach dem Ende wird eine gespeicherte Prüfung beim Laden noch übernommen. */
    const KEEP_AFTER_END_MS = 60 * 60 * 1000;
    const MS_PER_MINUTE = 60 * 1000;

    // ---------- Elemente ----------

    const el = {
        clock: document.getElementById('currentTime'),
        form: document.getElementById('controls'),
        inputStart: document.getElementById('inputStart'),
        inputDuration: document.getElementById('inputDuration'),
        btnExtend: document.getElementById('btnExtend'),
        btnReset: document.getElementById('btnReset'),
        displayStart: document.getElementById('displayStart'),
        durationValue: document.getElementById('durationValue'),
        displayEnd: document.getElementById('displayEnd'),
        displayRemaining: document.getElementById('displayRemaining'),
    };

    // ---------- Zustand ----------

    /**
     * Eingestellte Prüfung oder null.
     * start: Zeitpunkt in ms seit 1970 (mit Datum, damit eine Prüfung von
     * gestern nicht als heutige erscheint), duration: Dauer in Minuten.
     * @type {{start: number, duration: number} | null}
     */
    let exam = null;

    /** true, sobald das Feld „Anfang“ von Hand geändert wurde (bis zum Übernehmen oder Zurücksetzen). */
    let startEdited = false;

    // ---------- Zeit-Hilfen ----------

    const pad = (n) => String(n).padStart(2, '0');
    const formatHM = (date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;
    const formatHMS = (date) => `${formatHM(date)}:${pad(date.getSeconds())}`;

    const examEnd = () => exam.start + exam.duration * MS_PER_MINUTE;

    /** @returns {'none' | 'pending' | 'running' | 'ended'} */
    function phaseAt(now) {
        if (!exam) return 'none';
        if (now < exam.start) return 'pending';
        if (now < examEnd()) return 'running';
        return 'ended';
    }

    /**
     * Solange keine Prüfung ansteht oder läuft und das Feld nicht von Hand
     * geändert wurde, zeigt „Anfang“ die aktuelle Uhrzeit. So gilt beim
     * Übernehmen der Zeitpunkt des Klicks und nicht der des Seitenaufrufs.
     */
    function startFollowsClock(now) {
        const phase = phaseAt(now);
        return !startEdited && (phase === 'none' || phase === 'ended');
    }

    /** Startzeitpunkt für „Übernehmen“ in ms – oder null bei ungültiger Eingabe. */
    function resolveStart(now) {
        if (startFollowsClock(now)) {
            return new Date(now).setSeconds(0, 0);
        }
        if (!startEdited) {
            return exam.start; // Prüfung steht an oder läuft: nur die Dauer ändert sich
        }
        const match = /^(\d{2}):(\d{2})/.exec(el.inputStart.value);
        if (!match) return null;
        return new Date(now).setHours(Number(match[1]), Number(match[2]), 0, 0);
    }

    function isValidDuration(value) {
        return Number.isInteger(value) && value >= 1 && value <= MAX_DURATION;
    }

    // ---------- Speicher ----------
    // Der Zugriff kann scheitern (z. B. privater Modus, gesperrte Websitedaten);
    // die Uhr läuft dann ohne Sicherung weiter.

    function readStoredExam(now) {
        try {
            localStorage.removeItem(LEGACY_STORAGE_KEY);
            const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
            const valid = data !== null && typeof data === 'object'
                && Number.isFinite(data.start) && isValidDuration(data.duration);
            const end = valid ? data.start + data.duration * MS_PER_MINUTE : 0;
            if (!valid || now > end + KEEP_AFTER_END_MS) {
                localStorage.removeItem(STORAGE_KEY);
                return null;
            }
            return { start: data.start, duration: data.duration };
        } catch {
            return null;
        }
    }

    function storeExam() {
        try {
            if (exam) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(exam));
            } else {
                localStorage.removeItem(STORAGE_KEY);
            }
        } catch {
            // ohne Speicher weiterarbeiten
        }
    }

    // ---------- Anzeige ----------

    /** Schreibt nur bei Änderung, damit der Browser nicht jede Sekunde alles neu setzt. */
    function setText(node, text) {
        if (node.textContent !== text) node.textContent = text;
    }

    function remainingText(phase, now) {
        if (phase === 'ended') return '00:00';
        if (phase !== 'running') return '--:--';
        // Aufgerundet: „00:00“ erscheint erst, wenn die Zeit wirklich abgelaufen ist.
        const minutes = Math.ceil((examEnd() - now) / MS_PER_MINUTE);
        return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
    }

    function render() {
        const nowDate = new Date();
        const now = nowDate.getTime();
        const phase = phaseAt(now);

        setText(el.clock, formatHMS(nowDate));

        setText(el.displayStart, exam ? formatHM(new Date(exam.start)) : '--:--');
        setText(el.durationValue, exam ? String(exam.duration) : '--');
        setText(el.displayEnd, exam ? formatHM(new Date(examEnd())) : '--:--');

        setText(el.displayRemaining, remainingText(phase, now));
        el.displayRemaining.dataset.phase = phase;

        el.btnExtend.disabled = !exam || exam.duration + EXTEND_MINUTES > MAX_DURATION;

        // Feld „Anfang“ mitführen – nicht, während es den Fokus hat.
        if (startFollowsClock(now) && document.activeElement !== el.inputStart) {
            const current = formatHM(nowDate);
            if (el.inputStart.value !== current) el.inputStart.value = current;
        }
    }

    /** Eingabefelder auf die eingestellte Prüfung setzen. */
    function syncInputs() {
        el.inputStart.value = formatHM(new Date(exam.start));
        el.inputDuration.value = String(exam.duration);
    }

    // ---------- Aktionen ----------

    function applySettings(event) {
        event.preventDefault();
        const now = Date.now();
        const start = resolveStart(now);
        const duration = Number(el.inputDuration.value);
        if (start === null || !isValidDuration(duration)) return;

        exam = { start, duration };
        startEdited = false;
        storeExam();
        syncInputs();
        render();
    }

    function extendExam() {
        if (!exam || exam.duration + EXTEND_MINUTES > MAX_DURATION) return;
        exam = { start: exam.start, duration: exam.duration + EXTEND_MINUTES };
        storeExam();
        el.inputDuration.value = String(exam.duration);
        render();
    }

    function resetExam() {
        exam = null;
        startEdited = false;
        storeExam();
        el.inputDuration.value = String(DEFAULT_DURATION);
        render(); // setzt „Anfang“ wieder auf die aktuelle Uhrzeit
    }

    // ---------- Takt ----------

    /** Aktualisiert die Anzeige jeweils zum Sekundenwechsel (kein Auslassen oder Stottern). */
    function tick() {
        render();
        setTimeout(tick, 1000 - (Date.now() % 1000));
    }

    // ---------- Start ----------

    el.form.addEventListener('submit', applySettings);
    el.btnExtend.addEventListener('click', extendExam);
    el.btnReset.addEventListener('click', resetExam);
    el.inputStart.addEventListener('input', () => { startEdited = true; });
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) render(); // nach Tab-Wechsel sofort aktuell
    });

    exam = readStoredExam(Date.now());
    if (exam) {
        syncInputs();
    } else {
        el.inputDuration.value = String(DEFAULT_DURATION);
    }
    tick();
})();
