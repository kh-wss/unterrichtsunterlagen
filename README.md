# Unterrichtsmaterialien Elektrotechnik

Interaktive Animationen, Infoseiten und Werkzeuge für den Unterricht – gehostet
über GitHub Pages, zum Ansehen im Browser, am Beamer und zum Einbetten in Moodle.

**Übersicht:** <https://kh-wss.github.io/unterrichtsunterlagen/>

Die Übersicht ist der Link, den man weitergibt. Sie führt zu allen Seiten und
liefert zu jeder Seite den fertigen Moodle-Einbettungscode.

## Struktur

```
unterrichtsunterlagen/
├── index.html                      ← Übersicht (Inhalt wird automatisch erzeugt)
├── uebersicht.json                 ← Sachgebiete, Reihenfolge, Ausnahmen der Übersicht
├── .github/
│   ├── scripts/uebersicht.py       ← erzeugt die Übersicht
│   └── workflows/uebersicht.yml    ← baut und veröffentlicht bei jeder Änderung auf main
├── shared/style.css                ← Stylesheet der älteren Seiten (LF2, LF5)
├── <thema>/<seite>/index.html      ← je Seite ein Ordner, z. B. wechselspannung/erzeugung/
└── tools/pruefungstimer/           ← Werkzeuge
```

Jede Seite liegt als `index.html` in einem eigenen Ordner; daraus ergeben sich
Adressen ohne Dateiendung, z. B.
`https://kh-wss.github.io/unterrichtsunterlagen/wechselspannung/erzeugung/`.

## Übersicht – wie sie entsteht

Bei jeder Änderung auf `main` läuft die GitHub Action „Übersicht erzeugen und
veröffentlichen“. Sie

1. sucht alle Seiten `<ordner>/<unterordner>/index.html`,
2. liest Titel (`<title>`) und Beschreibung (`<meta name="description">`),
3. ordnet jede Seite über ihren ersten Ordner einem Sachgebiet zu
   (`uebersicht.json` → `sachgebiete`),
4. schreibt die Karten (untereinander, je mit kleiner Vorschau wie in Moodle,
   `?buehne=1`) samt Moodle-Einbettungscode in `index.html` zwischen
   `<!-- UEBERSICHT:ANFANG -->` und `<!-- UEBERSICHT:ENDE -->` und
5. veröffentlicht die Seite auf GitHub Pages.

Die Vorschauen laden erst, wenn sie ins Bild kommen, und werden beim
Wegscrollen wieder entladen – so laufen nie alle Animationen gleichzeitig.
Seiten ohne Vorschau-Ansicht zeigen statt der Vorschau einen Hinweis.

**Neue Seite:** Ordner mit `index.html` anlegen, `<title>` und
`<meta name="description">` setzen – fertig. Liegt der Ordner in einem neuen
Thema (z. B. `kondensator/`), das Thema in `uebersicht.json` einem Sachgebiet
zuordnen; sonst erscheint die Seite unter „Weitere“.

**`uebersicht.json`:**

| Eintrag | Wirkung |
|---|---|
| `sachgebiete` | Abschnitte der Übersicht in dieser Reihenfolge, je mit den Themenordnern; „Werkzeuge“ steht immer am Ende |
| `seiten` | Angaben je Seite, die von der Seite selbst abweichen: `titel`, `text`, `art` (Animation, Infoseite, Werkzeug), `reihenfolge` |
| `ausblenden` | Seiten, die (noch) nicht in der Übersicht erscheinen sollen, z. B. Platzhalter; erreichbar bleiben sie trotzdem |

**Lokal ansehen oder prüfen:**

```bash
python3 .github/scripts/uebersicht.py            # index.html neu erzeugen
python3 .github/scripts/uebersicht.py --pruefen  # nur prüfen, Hinweise ausgeben
```

### Einmalige Einstellung

Damit die Action veröffentlichen darf: **Settings → Pages → „Build and
deployment“ → Source: „GitHub Actions“**. (Vorher war „Deploy from a branch“
eingestellt; damit würde die Übersicht nur beim nächsten Merge, aber nicht
automatisch aktualisiert.)

## Einbindung in Moodle

Die Seiten nicht in eine Moodle-Textseite kopieren (Moodle entfernt Skripte),
sondern von GitHub Pages einbetten. Den Code gibt es auf der Übersicht unter
„Moodle-Einbettung“: Überschrift, kleine Vorschau nur mit der Bühne
(`?buehne=1`, Rahmen 560 × 315 px mit fester Höhe, weil Moodle beim Speichern
eine Höhe aus `aspect-ratio` verliert) und Link auf die volle Seite. Seiten ohne
Vorschau-Ansicht bekommen Überschrift und Link. In Moodle im Texteditor auf die
HTML-Ansicht umschalten und den Code einfügen.

## Datenschutz

Keine Seite lädt etwas von fremden Servern: Schriften sind Systemschriften oder
liegen im Repo (`tools/pruefungstimer/fonts/`).
