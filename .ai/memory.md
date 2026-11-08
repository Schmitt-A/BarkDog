# Langzeitgedächtnis BarkDog YAMNet (Memory)

## ADR: Mobile Optimierung & CNN14 Klassifizierungszeit-Badge
- **Kontext:**
  Das Dashboard wurde primär auf Desktop-Breiten genutzt, war jedoch auf Smartphones durch 6 feste Tabellenspalten (horizontaler Überlauf) und unzureichende Touch-Targets suboptimal bedienbar. Zudem wünschte der Nutzer Transparenz über die Ausführungszeit des CNN14 KI-Modells je Clip im Protokoll.
- **Entscheidung:**
  1. **Inferenzzeit-Tracking:** `detector.py` erfasst die Berechnungsdauer `dur = time.time() - t_start` von CNN14 und speichert sie direkt in `cnn14['duration']` und `cnn14['inferenceTimeStr']` (z.B. `"1.18s"`).
  2. **Zeit-Badge im Protokoll:** Ein lilafarbenes Badge mit Blitz-Icon (`⚡ 1.18s`, `.badge-cnn14-time`) wird neben dem Bestätigt-Badge in der Spalte "Stufe 2: CNN14 Verifier" gerendert.
  3. **Adaptive Card View auf Smartphones (≤ 640px):** Statt horizontalem Tabellenscrollen verwandeln sich die Zeilen auf mobilen Geräten per CSS in native Karten:
     - Header: Datum & Uhrzeit prominent links, Lösch-Button rechts (34x34px Touch-Target).
     - Body: YAMNet- und CNN14-Balken mit Prozentwerten und Badges sauber untereinander.
     - Footer: 100% breiter Play-Button (`Anhören`), der bequem mit dem Daumen bedient werden kann.
  4. **2x2 KPI-Grid & Touch-Slider:** Die 4 KPI-Karten bilden auf Smartphones ein kompaktes 2x2-Raster. Der Slider-Thumb wurde auf 22x22px vergrößert, um auf Touchscreens präzise justierbar zu sein.
- **Lektionen:**
  - Reine CSS-Transformation (`display: block` auf `tr`/`td`) erspart redundanten HTML-Code und liefert auf Desktops die klassische Tabelle und auf Smartphones automatisch ein natives App-Karten-Layout.

## ADR: Dynamische CNN14-Schwellenwertfilterung & Server-Persistenz ("fest im Programm")
- **Kontext:**
  Die oberen 4 KPI-Karten ("Bestätigte Beller", "Aktivste Phase", "Letzter Beller", "Höchste Konfidenz") basierten zuvor auf statischen Rohdaten (`allEvents.length`), ohne den Schieberegler von Stufe 2 (CNN14) zu berücksichtigen. Zudem war die eingestellte Schwelle nur im `localStorage` des jeweiligen Browser-Clients hinterlegt.
- **Entscheidung:**
  1. **Server-Persistenz:** Die Einstellungen werden serverseitig in `/app/data/settings.json` persistiert (`cnn14Threshold`, `cnn14ThresholdPct`, `sensitivity`, `updatedAt`). Der Hintergrunddienst `detector.py` lädt diese Datei beim Start via `load_settings()` und exponiert sie über `GET /api/settings` und `POST /api/settings`.
  2. **Globale Konsistenz:** Beim Initialisieren jeder Browser-Session ruft `app.js` `fetchServerSettings()` ab, sodass auf jedem Gerät (Smartphone, Tablet, Desktop) dieselbe konfigurierte Schwelle aktiv ist.
  3. **Dynamische Top-KPIs:** `updateTopKpiStats()` filtert `allEvents` live nach `getEventCnn14ScorePct(ev) >= filterState.cnn14Threshold`:
     - `statTotalBarks`: Exakte Anzahl an Bellern mit $\ge$ Schwelle.
     - `statLastDetection`: Zeitstempel des letzten Bellers mit $\ge$ Schwelle.
     - `statTopConfidence`: Höchste Konfidenz unter den gefilterten Bellern.
     - `kpiPeakTime`: Aktivste Stunde des Tages/Zeitraums bezogen auf die gefilterten Beller.
- **Lektionen:**
  1. Volume-Mount `./data:/app/data` bzw. `./data:/data:ro` in Nginx ermöglicht das Ausliefern von `data/settings.json` sowohl direkt über Nginx als auch über die REST-API des Python-Detektors.
  2. Beim Speichern von JSON-Konfigurationsdateien immer atomare Schreiboperationen (`tempfile` + `os.replace`) verwenden, um Datenkorruption bei gleichzeitigem Lesezugriff zu verhindern.

## ADR: Automatischer Standard-Filter "Aktueller Tag" & Bidirektionale Sync
- **Kontext:**
  Beim Öffnen des Dashboards war zuvor "Alle Tage" als Standardfilter aktiv, wodurch historische Beller mit heutigen vermischt wurden. Der Nutzer wünschte, dass standardmäßig immer der aktuelle Tag ("Heute") fokussiert ist und Protokoll, obere KPI-Kacheln sowie das Diagramm exakt synchron diesen Tag spiegeln.
- **Entscheidung:**
  1. **Standard auf "Heute":** `filterState.timeRange = 'today'` und `<option value="today" selected>Heute</option>` als Default.
  2. **Synchronisierte KPIs & Diagramm:**
     - Obere 4 KPIs (`statTotalBarks`, `kpiPeakTime`, `statLastDetection`, `statTopConfidence`) berechnen sich strikt aus `getFilteredEvents()`, spiegeln also immer den aktiven Filter (z.B. heute) wider.
     - Wenn heute noch keine Beller registriert wurden, zeigt `kpiPeakTime` sauber `Keine Beller` statt veralteter Vortagswerte.
  3. **Bidirektionale Kopplung:**
     - Änderungen am Protokoll-Filter ("Heute", "Diese Woche", "Bestimmter Tag") passen das Diagramm an.
     - Klicks auf Datumsauswahl, "Heute"-Button oder Tabs ("Tag" / "Woche") im Diagrammbereich aktualisieren automatisch den Protokollfilter und die oberen KPIs mit.
  4. **Filter-Reset:** Der Reset-Button setzt konsistent auf den Ausgangszustand "Heute" zurück.

## Projekt-Konvention: Anwendungsname "BarkDog Filou"
- Die Anwendung heißt offiziell **BarkDog Filou** (2-Stufen Audio-KI mit YAMNet Vorfilter & CNN14 Verifier).
- UI-Titel, Header, Footer und CSV-Export-Dateiname sind einheitlich auf `BarkDog Filou` / `barkdog_filou_protokoll_...` angepasst.

## ADR: Mobile Optimierung für Diagramm-Auswertung & Bell-Statistik
- **Kontext:**
  Auf Smartphones wurde das 24h-SVG auf ~76px gestaucht, Schriften wurden unleserlich (~3.8px), 1px dünne Balken konnten nicht zuverlässig angetippt werden, und Klicks führten zu einem abrupten Sprung weg vom Diagramm zur Tabelle. Zudem fehlten in der Sektion direkte statistische Kennzahlen.
- **Entscheidung:**
  1. **Horizontales Touch-Scrollen für 24h-Diagramm:** Auf Mobilgeräten erhält das 24h-Diagramm eine feste Mindestbreite von `640px` in einem flüssig wischbaren Container (`.chart-scroll-wrapper.day-mode`). Texte bleiben gestochen scharf (10–11px), Stundenbalken sind gut erkennbar. Ein Badge weist auf die Wischbarkeit hin.
  2. **Auto-Zentrierung:** Beim Aufruf auf Smartphones wird die Ansicht automatisch auf die Spitzenstunde bzw. die aktuelle Uhrzeit zentriert.
  3. **Vollflächige Touch-Targets:** Jede Stunde und jeder Wochentag erhält ein transparentes Overlay (`bar-touch-target`) über die gesamte Diagrammhöhe, wodurch jede Berührung mit dem Daumen zuverlässig erkannt wird.
  4. **Lokale Bell-Statistik Mini-Cards:** Direkt über dem Diagramm werden 4 kompakte Kacheln angezeigt (Beller, Aktivste Phase, Ruhigste Phase / Schnitt, Höchste Konfidenz), die die Kennzahlen der gewählten Ansicht direkt im Blick halten.
  5. **Mobiles Feedback-Banner:** Bei Berührung eines Balkens springt die Ansicht auf Smartphones nicht mehr abrupt weg, sondern zeigt direkt unter dem Diagramm ein Aktionsbanner mit Bestätigung, `[Im Protokoll ansehen ↑]` und `[✕ Aufheben]`.

## ADR: "Filou KI-Trainer" & Active Learning (Stufe 3: Personalisiertes Stimmprofil)
- **Kontext:**
  Allgemeine Modelle (YAMNet & CNN14) sind auf AudioSet trainiert und kennen weder die spezifische Stimmcharakteristik von Filou noch die akustischen Eigenheiten der Wohnung (z.B. TV, Geschirr, Husten). Der Nutzer wünschte eine schnelle 1-Klick-Oberfläche, um aussortierte Clips anzuhören, als „Ja (Beller)“ oder „Nein (Fehlalarm)“ zu markieren und das Modell dadurch kontinuierlich und spürbar zu verbessern.
- **Entscheidung:**
  1. **Schnell-Review UI ("Filou KI-Trainer"):**
     - Öffnet über Header-Button `🎓 KI trainieren (X)`.
     - Zeigt aktuellen Clip mit Auto-Play, Clip-Zähler, YAMNet-/CNN14-Score und Fortschrittsbalken.
     - Zwei große Hauptbuttons: `❌ Nein (Kein Bellen)` und `✅ Ja, Beller! (Filou bellt)`.
     - Tastenkürzel: `N`/`←` für Nein, `J`/`→` für Ja, `Leertaste` für Play/Pause, `S` für Überspringen.
     - Nach Klick oder Tastendruck springt sofort ohne Wartezeit der nächste Clip an.
  2. **Akustischer Merkmalsfingerabdruck (96D Vektor):**
     - Für jede Aufnahme wird aus FFT-Energiespektrum (32 Frequenzbänder), zeitlicher Hüllkurve (32 Abschnitte) und CNN14-Wahrscheinlichkeiten (32 Klassen) ein normalisierter Vektor gebildet.
  3. **Persistierter Datensatz & Filou-Stimmprofil:**
     - Speicherung gelabelter Audios in `data/dataset/barks/` und `data/dataset/noise/`.
     - Berechnet live die Positiv- und Negativ-Exemplare in `data/filou_profile.json`.
  4. **Live-Inferenz-Upgrade in `detector.py`:**
     - Eingehende Geräusche werden via Cosine Similarity mit Filous Stimmprofil abgeglichen (`evaluate_filou_match`).
     - **Filou-Stimm-Boost:** Hohe Übereinstimmung mit Filous Stimme (≥ 70%) boostet die Konfidenz (bestätigt auch leisere oder atypische Beller).
     - **Fehlalarm-Filterung:** Übereinstimmung mit gelernten Fehlalarmen (≥ 85%) senkt die Konfidenz und verhindert Fehlalarme.
     - Ereignisse erhalten ein transparentes Stimm-Badge: `🎯 Filou (XX%)`.
  5. **Endlosschleife (Loop-Playback) im KI-Trainer:**
     - Clips werden im Trainer-Modal automatisch in Dauerschleife (`audio.loop = true`) abgespielt, bis der Nutzer eine Entscheidung trifft oder pausiert.
     - Das Server-Mikrofon wird während des Loops mit `/api/pause?duration=120.0` stummgeschaltet und bei Entscheidung/Pause/Schließen sofort über `/api/resume` reaktiviert, um Rückkopplungen auf den Detektor zu verhindern.
- **Lektionen:**
  - Active Learning mit K-NN / Exemplar-Matching auf Audio-Feature-Vektoren liefert sofortige Personalisierung ohne langes, rechenintensives Re-Training auf dem Raspberry Pi.

## ADR: Episoden-Gruppierung (Zusammenhängende Bell-Serien)
- **Kontext:**
  Hunde bellen selten isoliert, sondern meist in Serien/Bursts (z.B. 4–15 Beller innerhalb von 30–60 Sekunden). Bisher wurde jede 1–2 Sekunden lange Detektion als eigenständige Zeile dargestellt, was das Protokoll bei längeren Bell-Phasen überfüllte und die Übersicht erschwerte.
- **Entscheidung:**
  1. **Single-Linkage Gap Clustering ($\le$ 60 Sekunden):**
     - Liegt zwischen zwei aufeinanderfolgenden Bellern ein Zeitabstand von maximal 60 Sekunden, gehören sie zur selben zusammenhängenden Bell-Serie (Episode).
     - Überschreitet die Pause 60 Sekunden, schließt die Serie ab und die nächste Erkennung eröffnet eine neue Episode.
  2. **Master-Detail Protokoll-Ansicht:**
     - **Master-Zeile:** Zeigt Zeitbereich (z.B. *14:15:02 – 14:15:44 Uhr*), Gesamtdauer (*⏱️ 42s*), Beller-Anzahl (*🐶 4 Beller*), Maximal- & Durchschnittskonfidenzen (CNN14 & YAMNet) sowie Filou-Stimm-Erkennung.
     - **Aufklappbar:** Über `[▼ 4 Beller]` klappen eingerückte Kind-Zeilen mit Einzelzeiten, Delta-Abstand (`+16s`), eigenem Play- und Einzellösch-Button auf. Der Aufklapp-Zustand (`expandedEpisodeIds` Set) bleibt beim periodischen Polling stabil erhalten.
     - **Serien-Playlist-Player:** `[▶ Serie (4x)]` spielt alle Clips der Serie chronologisch hintereinander ab, mit lückenloser Server-Pausierung des Mikrofons.
  3. **Steuerung & Persistenz:**
     - Toggle in der Filterleiste: `☑️ Serien gruppieren (≤ 60s)` (Standard: aktiv, gespeichert in `localStorage`).
  4. **KPIs & Export:**
     - "Bestätigte Beller" zeigt zusätzlich die Anzahl der Serien (`3 Serien`).
     - CSV-Export enthält `Serie_Nr`, `Serie_Beller_Anzahl` und `Clip_In_Serie`.


## ADR: Active Learning Queue-Reparatur, Transparenz & Modell-Lernkurve (Stufe 3)
- **Kontext:**
  1. Im KI-Trainer wurden wiederholt dieselben 6 Clips in Endlosschleife abgespielt. Die Queue las nur aus `trash.json` und schloss bereits bewertete Clips nicht aus. 163 unbewertete Beller aus `events.json` wurden gar nicht erst angeboten.
  2. Dem Nutzer fehlte die Sichtbarkeit, wie sich das Modell durch die Bewertungen verbessert und ob die KI die Kategorien mit der Zeit treffsicherer vorhersagt.
- **Entscheidung:**
  1. **Strikte Filterung unbewerteter Clips:**
     - `/api/trainer/queue` schließt bereits gelabelte IDs (`labeled_dataset.json` und `item.reviewed == True`) aus.
     - Sowohl verworfene Geräusche (`trash.json`) als auch unbewertete Beller (`events.json`) werden einbezogen.
     - Quellen-Umschalter `[ Alle unbewerteten (X) | Nur Papierkorb (Y) | Nur Protokoll (Z) ]`.
  2. **Live KI-Vorhersage je Clip:**
     - Bei jedem Clip in der Queue extrahiert das Backend in ~4ms den 96D-Feature-Vektor und gleicht ihn gegen Filous Stimmprofil (`evaluate_filou_match`) ab.
     - Im UI wird vor der Entscheidung angezeigt: `🤖 KI-Vorhersage: Filou (89.5%)` oder `Fehlalarm (92%)` oder `Unsicher`. So erlebt der Nutzer direkt, wie das Modell lernt und mit jedem bewerteten Clip treffsicherer wird.
  3. **Visualisierung des Lernfortschritts über die Zeit:**
     - **Reifegrad-Level:** Level 1: Basis (0-9 Muster) -> Level 2: Kalibriert (10-24 Muster) -> Level 3: Fortgeschritten (25-49 Muster) -> Level 4: Profi-Stimmprofil (50+ Muster) mit Fortschrittsbalken zum nächsten Meilenstein.
     - **Treffsicherheit / Trennschärfe:** Prozentualer Zuverlässigkeits-Score berechnet aus der Distanz zwischen Filous Stimmzentrum und typischen Fehlalarmen.
     - **Verlaufskurve:** Aufklappbarer Tagesverlauf mit gelernten Positiv- und Negativ-Mustern.
- **Lektionen:**
  - Active-Learning-Queues müssen immer gegen die persistierte Label-Ground-Truth abgeglichen werden, um Loops zu vermeiden.
  - Das Anzeigen der Modell-Tendenz vor der Benutzerentscheidung schafft sofortiges Vertrauen und macht den Lernfortschritt greifbar.

## ADR: GitHub-Veröffentlichung, Privatsphäre & Large-Model-Strategie
- **Kontext:**
  Das Projekt "BarkDog Filou" soll unter `https://github.com/Schmitt-A/BarkDog` als Open-Source Repository veröffentlicht werden. Dabei dürfen keinesfalls private Audioaufnahmen oder sensible Wohnungsgeräusche geleakt werden. Zudem übersteigt das Stufe-2-Modell (`models/panns_cnn14.onnx`, 313 MB) das strikte 100-MB-Dateilimit von GitHub.
- **Entscheidung:**
  1. **Strikte Datensouveränität & Privacy (`.gitignore`):**
     - Alle Audioaufnahmen (`data/recordings/*.wav`, `data/dataset/**/*.wav`), Datenbanken (`events.json`, `trash.json`, `status.json`, `labeled_dataset.json`) und das akustische Stimmprofil (`filou_profile.json`) werden per `.gitignore` vom Tracking ausgeschlossen.
     - Bereitstellung von `data/settings.example.json` als Konfigurationsvorlage.
  2. **Automatisierter Modell-Download (`download_models.sh`):**
     - `models/panns_cnn14.onnx` wird nicht in Git committet.
     - Ein automatisiertes Download-Skript `download_models.sh` lädt die ONNX-Gewichte direkt von Hugging Face herunter und prüft die SHA-256 Checksumme (`be2badf3f2...`).
     - YAMNet (`yamnet.tflite`, ~4 MB) und Web-Modelle (`public/model/`, ~16 MB) bleiben im Repository, da sie deutlich unter dem Limit liegen und Out-of-the-Box Lauffähigkeit bieten.
  3. **Dokumentation:**
     - Eine vollumfängliche, professionelle `README.md` auf Deutsch dokumentiert die 3-Stufen-KI, Docker-Setup, Hardware-Voraussetzungen, Web-Dashboard und REST-API.
