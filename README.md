# Unterrichtsmaterialien

Sammlung von HTML-Seiten (Werkzeuge, Animationen, Informationsseiten) zum
Hosten über GitHub Pages und zur Einbindung in Moodle.

## Struktur

```
unterrichtsmaterialien/
├── index.html                                  ← Übersichtsseite (Portal)
├── shared/
│   └── style.css                               ← gemeinsames Stylesheet
├── tools/
│   └── pruefungstimer/
│       └── index.html
├── lf2-schutzorgane/
│   └── ls-schalter-auslosecharakteristik/
│       └── index.html
└── lf5-kompensation/
    └── animation/
        └── index.html
```

Jede Unterseite liegt in einem eigenen Ordner als `index.html`, dadurch
ergeben sich saubere URLs ohne Dateiendung, z. B.:

```
https://DEIN-USERNAME.github.io/unterrichtsmaterialien/lf5-kompensation/animation/
```

## 1. Hochladen auf GitHub

1. Neues Repository auf github.com anlegen, Name z. B. `unterrichtsmaterialien`
   (öffentlich, damit GitHub Pages auf dem Free-Plan funktioniert).
2. Auf der Repo-Seite: **Add file → Upload files**.
3. Den kompletten entpackten Ordner `unterrichtsmaterialien` (also dessen
   Inhalt, nicht den Ordner selbst) per Drag & Drop in das Upload-Fenster
   ziehen. Moderne Browser übertragen dabei die Unterordnerstruktur mit.
   Falls das nicht funktioniert: einzelne Unterordner nacheinander hochladen.
4. Commit-Nachricht eingeben (z. B. "Initiale Struktur") und committen.

## 2. GitHub Pages aktivieren

1. Im Repository: **Settings → Pages**.
2. Unter "Build and deployment": Branch `main`, Ordner `/ (root)` auswählen.
3. Speichern. Nach ein bis zwei Minuten ist die Seite erreichbar unter:
   `https://DEIN-USERNAME.github.io/unterrichtsmaterialien/`

## 3. Neue Seite hinzufügen

1. Neuen Unterordner mit sprechendem Namen anlegen, z. B.
   `lf3-irgendwas/neues-thema/`.
2. Darin eine `index.html` ablegen. Im `<head>` das gemeinsame Stylesheet
   einbinden – Pfadtiefe beachten:

   ```html
   <link rel="stylesheet" href="../../shared/style.css">
   ```

   (Bei zwei Ordnerebenen unter dem Root sind das zwei `../`.)

3. Für die Navigation einen Rück-Link einbauen:

   ```html
   <a class="back-link" href="../../">&larr; Zur Übersicht</a>
   ```

4. In `index.html` (Root) im passenden Abschnitt eine neue Karte ergänzen:

   ```html
   <a class="card" href="./lf3-irgendwas/neues-thema/">
     <div class="card-top">
       <span class="card-title">Titel der Seite</span>
       <span class="badge">LF3</span>
     </div>
     <p class="card-desc">Kurze Beschreibung.</p>
   </a>
   ```

5. Neue Dateien hochladen (Upload files oder, falls eingerichtet, `git push`).

## 4. Einbindung in Moodle

Statt den HTML-/CSS-Code direkt in den Moodle-Editor einzufügen (wird oft
gefiltert), die GitHub-Pages-URL per iframe einbetten:

```html
<iframe src="https://DEIN-USERNAME.github.io/unterrichtsmaterialien/tools/pruefungstimer/"
        width="100%" height="600" style="border:none;"></iframe>
```

Höhe (`height`) je nach Inhalt anpassen.

## Gemeinsames Stylesheet

`shared/style.css` enthält Farben, Schriften und Komponenten (Karten,
Badges, Platzhalter-Hinweis etc.) als CSS-Variablen im `:root`-Block.
Anpassungen dort wirken sich auf alle Seiten aus, die das Stylesheet
einbinden.
