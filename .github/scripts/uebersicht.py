#!/usr/bin/env python3
"""Erzeugt den Inhalt der Übersichtsseite index.html aus den Ordnern des Repos.

Jede Seite <ordner>/<unterordner>/index.html wird zu einer Karte. Titel aus <title>,
Text aus <meta name="description">, Sachgebiet über den ersten Ordner; Abweichungen,
Reihenfolge und ausgeblendete Seiten stehen in uebersicht.json.

Zu jeder Karte gehört der Moodle-Einbettungscode in der Form der Lehrkraft:
fette Überschrift wie im Moodle-Editor, kleine Vorschau nur mit Bühne (?buehne=1,
fester Rahmen 560 × 315 px, weil Moodle beim Speichern die Höhe aus aspect-ratio
verliert) und Link auf die volle Seite. Seiten ohne Vorschau-Ansicht bekommen
Überschrift und Link.

Aufruf (im Wurzelordner des Repos oder mit Pfad):
    python3 .github/scripts/uebersicht.py            schreibt index.html
    python3 .github/scripts/uebersicht.py --pruefen  ändert nichts, Exit 1 bei Fehlern

Nur Standardbibliothek – läuft lokal und in der GitHub Action.
"""
import argparse
import datetime
import html
import json
import re
import subprocess
import sys
import unicodedata
from pathlib import Path

ANFANG = '<!-- UEBERSICHT:ANFANG -->'
ENDE = '<!-- UEBERSICHT:ENDE -->'
WEITERE = 'Weitere'
VORSCHAU = re.compile(r"""classList\.add\(\s*['"]buehne['"]\s*\)""")


def fehler(text):
    print(f'FEHLER: {text}', file=sys.stderr)
    sys.exit(1)


def hinweis(text):
    print(f'Hinweis: {text}', file=sys.stderr)


def lies_seite(pfad: Path):
    q = pfad.read_text(encoding='utf-8', errors='replace')
    m = re.search(r'<title[^>]*>(.*?)</title>', q, re.S | re.I)
    titel = html.unescape(re.sub(r'\s+', ' ', m.group(1)).strip()) if m else ''
    m = re.search(r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']\s*/?>', q, re.S | re.I)
    text = html.unescape(re.sub(r'\s+', ' ', m.group(1)).strip()) if m else ''
    return titel, text, bool(VORSCHAU.search(q))


def sortierschluessel(s: str):
    s = s.casefold().replace('ß', 'ss')
    return ''.join(c for c in unicodedata.normalize('NFKD', s) if not unicodedata.combining(c))


def kennung(rel: str):
    return 'e-' + re.sub(r'[^a-z0-9]+', '-', rel.lower()).strip('-')


def einbettungscode(adresse: str, titel: str, art: str, vorschau: bool):
    t = html.escape(titel, quote=True)
    kopf = f'<h3 dir="ltr" style="text-align: left;"><strong>{t}</strong></h3>'
    if art == 'Animation':
        linktext = 'Animation mit allen Bedienelementen öffnen (für Beamer / Vollbild)'
    else:
        linktext = f'{art} in neuem Fenster öffnen'
    link = f'<p><a href="{adresse}" target="_blank">{linktext}</a></p>'
    if not vorschau:
        return f'{kopf}\n{link}'
    rahmen = (f'<div><iframe src="{adresse}?buehne=1" width="560" height="315"\n'
              f'  style="width:100%; max-width:560px; height:315px; border:0;"\n'
              f'  loading="lazy" title="Vorschau – {t}"></iframe></div>')
    return f'{kopf}\n{rahmen}\n{link}'


def stand(wurzel: Path):
    try:
        d = subprocess.run(['git', '-C', str(wurzel), 'log', '-1', '--format=%cs'],
                           capture_output=True, text=True, check=True).stdout.strip()
        return datetime.date.fromisoformat(d).strftime('%d.%m.%Y')
    except Exception:
        return datetime.date.today().strftime('%d.%m.%Y')


def baue(wurzel: Path):
    cfg_pfad = wurzel / 'uebersicht.json'
    try:
        cfg = json.loads(cfg_pfad.read_text(encoding='utf-8'))
    except json.JSONDecodeError as e:
        fehler(f'uebersicht.json ist kein gültiges JSON (Zeile {e.lineno}, Spalte {e.colno}): {e.msg}')
    except FileNotFoundError:
        fehler('uebersicht.json fehlt im Wurzelordner.')

    adresse = cfg.get('adresse', '').rstrip('/') + '/'
    gebiete = cfg.get('sachgebiete', [])
    angaben = cfg.get('seiten', {})
    ausblenden = set(cfg.get('ausblenden', []))
    ordner_zu_gebiet = {}
    for g in gebiete:
        for o in g.get('ordner', []):
            ordner_zu_gebiet[o] = g

    seiten = []
    gefunden = set()
    for p in sorted(wurzel.glob('*/**/index.html')):
        rel_teile = p.relative_to(wurzel).parts
        if any(t.startswith(('.', '_')) for t in rel_teile) or rel_teile[0] in ('shared', 'node_modules'):
            continue
        rel = '/'.join(rel_teile[:-1]) + '/'
        gefunden.add(rel)
        if rel in ausblenden:
            continue
        titel, text, vorschau = lies_seite(p)
        a = angaben.get(rel, {})
        g = ordner_zu_gebiet.get(rel_teile[0])
        titel = a.get('titel') or titel or rel_teile[-2].replace('-', ' ').capitalize()
        text = a.get('text', text)
        # Formeln nicht umbrechen: Leerzeichen um = und · geschützt (nur Anzeige)
        text = re.sub(r'(?<=\S) ([=·]) (?=\S)', '\u00a0\\1\u00a0', text)
        art = a.get('art') or (g or {}).get('art') or 'Animation'
        if text.startswith('Gerüst für'):
            hinweis(f'{rel}: <meta name="description"> ist noch der Text aus dem Gerüst – durch eine Beschreibung der Animation ersetzen.')
        if not text:
            hinweis(f'{rel}: kein Text (weder <meta name="description"> noch "text" in uebersicht.json).')
        if g is None:
            hinweis(f'{rel}: Ordner „{rel_teile[0]}“ keinem Sachgebiet zugeordnet → „{WEITERE}“.')
        seiten.append({
            'rel': rel, 'titel': titel, 'text': text, 'art': art, 'vorschau': vorschau,
            'gebiet': g['name'] if g else WEITERE,
            'reihenfolge': a.get('reihenfolge', 999),
        })

    for rel in list(angaben) + list(ausblenden):
        if rel not in gefunden:
            hinweis(f'uebersicht.json nennt „{rel}“, diese Seite gibt es (noch) nicht.')

    reihen = [g['name'] for g in gebiete]
    werkzeug = [n for n in reihen if n == 'Werkzeuge']
    reihen = [n for n in reihen if n != 'Werkzeuge'] + [WEITERE] + werkzeug

    abschnitte = []
    for name in reihen:
        karten = sorted((s for s in seiten if s['gebiet'] == name),
                        key=lambda s: (s['reihenfolge'], sortierschluessel(s['titel'])))
        if karten:
            abschnitte.append((name, karten))

    return adresse, abschnitte, len(seiten)


def html_block(adresse, abschnitte, stand_text):
    e = html.escape
    z = []
    nav =' '.join(f'<a href="#{kennung(n)}">{e(n)}</a>' for n, _ in abschnitte)
    z.append(f'<nav class="sachgebiete" aria-label="Sachgebiete">{nav}</nav>')
    for name, karten in abschnitte:
        z.append(f'\n<section id="{kennung(name)}" aria-labelledby="{kennung(name)}-h">')
        z.append(f'<h2 id="{kennung(name)}-h">{e(name)}</h2>')
        z.append('<div class="karten">')
        for s in karten:
            k = kennung(s['rel'])
            code = einbettungscode(adresse + s['rel'], s['titel'], s['art'], s['vorschau'])
            if s['vorschau']:
                tipp = ('In Moodle im Texteditor auf die HTML-Ansicht umschalten und den Code einfügen. '
                        'Er zeigt eine kleine Vorschau nur mit der Bühne und einen Link auf die volle Seite.')
            else:
                tipp = ('In Moodle im Texteditor auf die HTML-Ansicht umschalten und den Code einfügen. '
                        'Diese Seite hat keine Vorschau-Ansicht – der Code bettet Überschrift und Link ein.')
            z.append('<article class="karte">')
            # Kleine Vorschau wie in Moodle: dieselbe Ansicht ?buehne=1, relativ verlinkt (läuft auch lokal).
            # Adresse in data-src: Das Skript in index.html lädt nur sichtbare Vorschauen und entlädt
            # sie beim Wegscrollen – sonst laufen alle Animationen gleichzeitig (Last am Schul-Laptop).
            if s['vorschau']:
                z.append(f'<div class="vorschau"><iframe data-src="./{e(s["rel"])}?buehne=1" '
                         f'title="Vorschau – {e(s["titel"])}"></iframe></div>')
            else:
                # Seite ohne Bühnenansicht (z. B. Werkzeug): ganze Seite verkleinert zeigen (1280 × 720,
                # skaliert vom Skript in index.html); nicht bedienbar, Klick öffnet die Seite.
                z.append(f'<a class="vorschau seite" href="./{e(s["rel"])}" tabindex="-1" aria-hidden="true">'
                         f'<iframe data-src="./{e(s["rel"])}" tabindex="-1" title="Seitenansicht – {e(s["titel"])}"></iframe>'
                         f'<span class="marke">Seitenansicht</span></a>')
            z.append('<div class="inhalt">')
            z.append(f'<span class="art">{e(s["art"])}</span>')
            z.append(f'<h3><a href="./{e(s["rel"])}">{e(s["titel"])}</a></h3>')
            z.append(f'<p class="text">{e(s["text"])}</p>')
            z.append('<div class="aktionen">')
            z.append(f'<a class="knopf haupt" href="./{e(s["rel"])}">Öffnen</a>')
            z.append(f'<button type="button" class="knopf" data-einbettung="{k}" '
                     f'data-titel="{e(s["titel"])}" data-hinweis="{e(tipp)}">Moodle-Einbettung</button>')
            z.append(f'<textarea id="{k}" hidden>{e(code, quote=False)}</textarea>')
            z.append('</div>')
            z.append('</div>')
            z.append('</article>')
        z.append('</div>')
        z.append('</section>')
    z.append(f'\n<footer>Stand: {e(stand_text)} · Diese Übersicht wird bei jeder Änderung automatisch erzeugt. · '
             f'<a href="https://github.com/kh-wss/unterrichtsunterlagen">Quelltext auf GitHub</a> · '
             f'Lizenz: <a href="https://github.com/kh-wss/unterrichtsunterlagen/blob/main/LICENSE">MIT</a></footer>')
    return '\n'.join(z)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('wurzel', nargs='?', default=None, help='Wurzelordner des Repos (Standard: zwei Ebenen über dem Skript)')
    ap.add_argument('--pruefen', action='store_true', help='nichts schreiben, nur prüfen')
    a = ap.parse_args()

    wurzel = Path(a.wurzel) if a.wurzel else Path(__file__).resolve().parents[2]
    index = wurzel / 'index.html'
    vorlage = index.read_text(encoding='utf-8')
    if vorlage.count(ANFANG) != 1 or vorlage.count(ENDE) != 1 or vorlage.index(ANFANG) > vorlage.index(ENDE):
        fehler(f'index.html braucht genau einmal {ANFANG} und danach genau einmal {ENDE}.')

    adresse, abschnitte, anzahl = baue(wurzel)
    block = html_block(adresse, abschnitte, stand(wurzel))
    neu = vorlage[:vorlage.index(ANFANG) + len(ANFANG)] + '\n' + block + '\n' + vorlage[vorlage.index(ENDE):]

    if a.pruefen:
        print(f'Übersicht: {anzahl} Seiten in {len(abschnitte)} Sachgebieten – geprüft, nichts geschrieben.')
        return
    index.write_text(neu, encoding='utf-8')
    print(f'Übersicht: {anzahl} Seiten in {len(abschnitte)} Sachgebieten → index.html')


if __name__ == '__main__':
    main()
