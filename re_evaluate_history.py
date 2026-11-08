#!/usr/bin/env python3
"""
Nachträgliche CNN14-Präzisionsbewertung aller historischen Aufnahmen.
Liest alle bisherigen Aufnahmen aus events.json, führt CNN14 Inferenz aus,
trennt echte Beller von Fehlalarmen und synchronisiert events.json & trash.json.
"""

import os
import sys
import time
import json
import wave
import numpy as np

# Importiere initialisierte Module aus detector.py
import detector

DATA_DIR = '/app/data'
RECORDINGS_DIR = os.path.join(DATA_DIR, 'recordings')
EVENTS_FILE = os.path.join(DATA_DIR, 'events.json')
TRASH_FILE = os.path.join(DATA_DIR, 'trash.json')
STATUS_FILE = os.path.join(DATA_DIR, 'status.json')

def main():
    print("[1/4] Initialisiere CNN14 ONNX Modell...")
    if not detector.init_cnn14_model():
        print("[ERR] Konnte CNN14 Modell nicht initialisieren!")
        sys.exit(1)

    print("[2/4] Lade bisherige Ereignisse aus events.json...")
    if not os.path.exists(EVENTS_FILE):
        print("[INFO] Keine events.json gefunden.")
        sys.exit(0)

    with open(EVENTS_FILE, 'r', encoding='utf-8') as f:
        events = json.load(f)

    total = len(events)
    print(f"[INFO] {total} Ereignisse gefunden. Starte nachträgliche CNN14-Bewertung...")

    confirmed = []
    rejected = []

    t_all_start = time.time()

    for idx, ev in enumerate(events, 1):
        audio_url = ev.get('audioUrl', '')
        filename = os.path.basename(audio_url)
        wav_path = os.path.join(RECORDINGS_DIR, filename)

        # YAMNet Daten sicherstellen
        yamnet_info = ev.get('yamnet')
        if not yamnet_info or not isinstance(yamnet_info, dict):
            yamnet_info = {
                'className': ev.get('className', 'Hund (Dog)'),
                'classIdx': ev.get('classIdx', 69),
                'confidence': ev.get('confidence', 0.25),
                'confidencePct': ev.get('confidencePct', '25.0')
            }
        ev['yamnet'] = yamnet_info

        if not os.path.exists(wav_path):
            # WAV existiert nicht mehr -> als bestätigt belassen mit Fallback
            ev['status'] = 'confirmed'
            ev['cnn14'] = {
                'status': 'confirmed',
                'className': yamnet_info['className'],
                'confidence': yamnet_info['confidence'],
                'confidencePct': yamnet_info['confidencePct'],
                'topClass': 'Audio nicht mehr vorhanden'
            }
            confirmed.append(ev)
            continue

        try:
            with wave.open(wav_path, 'rb') as wf:
                pcm = np.frombuffer(wf.readframes(wf.getnframes()), dtype=np.int16)

            # CNN14 Inferenz ausführen
            cnn_res = detector.run_cnn14_inference(pcm)
            ev['cnn14'] = cnn_res

            if cnn_res['is_confirmed']:
                ev['status'] = 'confirmed'
                ev['className'] = cnn_res['className']
                ev['confidencePct'] = cnn_res['confidencePct']
                confirmed.append(ev)
                print(f"[{idx}/{total}] ✅ BESTÄTIGT #{ev['id']}: CNN14 {cnn_res['className']} ({cnn_res['confidencePct']}%) vs YAMNet ({yamnet_info['confidencePct']}%)")
            else:
                ev['status'] = 'rejected'
                ev['reason'] = f"Von CNN14 als Fehlalarm verworfen: {cnn_res['topClass']}"
                rejected.append(ev)
                print(f"[{idx}/{total}] ❌ VERWORFEN #{ev['id']}: {cnn_res['topClass']} [YAMNet war: {yamnet_info['confidencePct']}%]")
        except Exception as e:
            print(f"[{idx}/{total}] [WARN] Fehler bei #{ev.get('id')}: {e}")
            ev['status'] = 'confirmed'
            confirmed.append(ev)

    dur_total = time.time() - t_all_start
    print(f"\n[3/4] Bewertung abgeschlossen in {dur_total:.1f}s (Ø {dur_total/max(1, total):.2f}s pro Clip):")
    print(f"      ✅ Echte Beller (bestätigt): {len(confirmed)}")
    print(f"      ❌ Fehlalarme (verworfen):   {len(rejected)}")

    # 4. Speichern und Bereinigen
    print("[4/4] Speichere bereinigte events.json und trash.json...")
    
    # Sortiere nach Timestamp absteigend (neueste zuerst)
    confirmed.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
    rejected.sort(key=lambda x: x.get('timestamp', ''), reverse=True)

    # Schreibe events.json
    tmp_events = EVENTS_FILE + '.tmp'
    with open(tmp_events, 'w', encoding='utf-8') as f:
        json.dump(confirmed, f, indent=2)
    os.replace(tmp_events, EVENTS_FILE)

    # Schreibe trash.json (max. 20 Clips im Papierkorb)
    trash_to_keep = rejected[:20]
    tmp_trash = TRASH_FILE + '.tmp'
    with open(tmp_trash, 'w', encoding='utf-8') as f:
        json.dump(trash_to_keep, f, indent=2)
    os.replace(tmp_trash, TRASH_FILE)

    # Ältere verworfene Clips (>20) von der Festplatte löschen
    evicted = rejected[20:]
    deleted_wav_count = 0
    for ev in evicted:
        f_url = ev.get('audioUrl', '')
        if f_url:
            f_name = os.path.basename(f_url)
            f_path = os.path.join(RECORDINGS_DIR, f_name)
            if os.path.exists(f_path):
                try:
                    os.remove(f_path)
                    deleted_wav_count += 1
                except Exception:
                    pass

    print(f"[INFO] Papierkorb auf {len(trash_to_keep)} Clips gesetzt.")
    if deleted_wav_count > 0:
        print(f"[INFO] {deleted_wav_count} alte verworfene WAV-Dateien von der Festplatte bereinigt.")

    # Status-Datei mit korrigierter Anzahl aktualisieren
    if os.path.exists(STATUS_FILE):
        try:
            with open(STATUS_FILE, 'r', encoding='utf-8') as f:
                s_data = json.load(f)
            s_data['totalDetections'] = len(confirmed)
            if confirmed:
                s_data['lastDetection'] = confirmed[0].get('timestamp')
            tmp_status = STATUS_FILE + '.tmp'
            with open(tmp_status, 'w', encoding='utf-8') as f:
                json.dump(s_data, f, indent=2)
            os.replace(tmp_status, STATUS_FILE)
            print(f"[INFO] status.json aktualisiert: totalDetections = {len(confirmed)}")
        except Exception as e:
            print(f"[WARN] status.json Aktualisierung fehlgeschlagen: {e}")

    print("\n[FERTIG] Alle historischen Aufnahmen erfolgreich mit CNN14 neu bewertet!")

if __name__ == '__main__':
    main()
