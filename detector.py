#!/usr/bin/env python3
"""
BarkDog Filou (YAMNet + CNN14) - 24/7 Server Background Audio Detector
2-stufige kaskadierte Audio-KI:
  Stufe 1: YAMNet TFLite (Echtzeit-Vorfilter 24/7 über ALSA USB-Mikrofon)
  Stufe 2: PANNs CNN14 ONNX (Präzisions-Verifier im Hintergrund-Worker)
Inklusive 20-Clip-Papierkorb, Wiederherstellung und integriertem API-Server (Port 5001).
"""

import os
import sys
import time

# Zeitzone festlegen (Europe/Berlin für korrekte deutsche Uhrzeit)
os.environ['TZ'] = os.environ.get('TZ', 'Europe/Berlin')
if hasattr(time, 'tzset'):
    time.tzset()
import json
import wave
import subprocess
import re
import signal
import threading
import queue
import shutil
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from datetime import datetime
import numpy as np
import tflite_runtime.interpreter as tflite
import onnxruntime as ort

DATA_DIR = os.environ.get('DATA_DIR', '/app/data')
RECORDINGS_DIR = os.path.join(DATA_DIR, 'recordings')
TRASH_FILE = os.path.join(DATA_DIR, 'trash.json')
EVENTS_FILE = os.path.join(DATA_DIR, 'events.json')
STATUS_FILE = os.path.join(DATA_DIR, 'status.json')
SETTINGS_FILE = os.path.join(DATA_DIR, 'settings.json')
TRAINER_DATASET_FILE = os.path.join(DATA_DIR, 'labeled_dataset.json')
FILOU_PROFILE_FILE = os.path.join(DATA_DIR, 'filou_profile.json')
DATASET_DIR = os.path.join(DATA_DIR, 'dataset')
DATASET_BARKS_DIR = os.path.join(DATASET_DIR, 'barks')
DATASET_NOISE_DIR = os.path.join(DATASET_DIR, 'noise')

MODEL_PATH = os.environ.get('MODEL_PATH', '/app/yamnet.tflite')
CLASS_MAP_PATH = os.environ.get('CLASS_MAP_PATH', '/app/yamnet_class_map.csv')
CNN14_MODEL_PATH = os.environ.get('CNN14_MODEL_PATH', '/app/models/panns_cnn14.onnx')
CNN14_CLASS_MAP_PATH = os.environ.get('CNN14_CLASS_MAP_PATH', '/app/models/class_labels_indices.csv')

SENSITIVITY = float(os.environ.get('SENSITIVITY', '0.25'))
CNN14_CONFIRM_THRESHOLD = float(os.environ.get('CNN14_CONFIRM_THRESHOLD', '0.20'))
MAX_TRASH_ITEMS = 20

SAMPLE_RATE = 16000
WINDOW_SAMPLES = 15600  # 0.975s für YAMNet TFLite
HOP_SAMPLES = 7800      # ~0.487s Überlappung
RING_BUFFER_SAMPLES = 40000  # 2.5 Sekunden Audio-Ringpuffer für die Wiedergabe

# Relevante Hundelaut-Klassen für YAMNet (521 Klassen)
DOG_CLASSES_YAMNET = {
    69: {'name': 'Hund (Dog)', 'de': 'Hund allgemein'},
    70: {'name': 'Bellen (Bark)', 'de': 'Hundebellen'},
    71: {'name': 'Kläffen (Yip)', 'de': 'Helles Kläffen'},
    72: {'name': 'Jaulen (Howl)', 'de': 'Hundegeheul'},
    73: {'name': 'Wuffen (Bow-wow)', 'de': 'Dumpfes Bellen'},
    74: {'name': 'Knurren (Growling)', 'de': 'Knurren'},
    75: {'name': 'Winseln (Whimper)', 'de': 'Winseln'},
    117: {'name': 'Hundeartige (Canidae)', 'de': 'Canidae'}
}
DOG_CLASS_INDICES_YAMNET = list(DOG_CLASSES_YAMNET.keys())

# Relevante Hundelaut-Klassen für CNN14 (AudioSet 527 Klassen)
CNN14_DOG_CLASSES = {
    74: {'name': 'Dog', 'de': 'Hund (Dog)'},
    75: {'name': 'Bark', 'de': 'Bellen (Bark)'},
    76: {'name': 'Yip', 'de': 'Kläffen (Yip)'},
    77: {'name': 'Howl', 'de': 'Jaulen (Howl)'},
    78: {'name': 'Bow-wow', 'de': 'Wuffen (Bow-wow)'},
    79: {'name': 'Growling', 'de': 'Knurren (Growling)'},
    80: {'name': 'Whimper (dog)', 'de': 'Winseln (Whimper)'}
}
CNN14_DOG_INDICES = set(CNN14_DOG_CLASSES.keys())

# Deutsche Übersetzungen gängiger AudioSet-Klassen zur Erklärung verworfener Clips
AUDIOSET_DE_NAMES = {
    74: 'Hund (Dog)',
    75: 'Bellen (Bark)',
    76: 'Kläffen (Yip)',
    77: 'Jaulen (Howl)',
    78: 'Wuffen (Bow-wow)',
    79: 'Knurren (Growling)',
    80: 'Winseln (Whimper)',
    0: 'Menschliche Sprache',
    1: 'Männerstimme',
    2: 'Frauenstimme',
    3: 'Kinderstimme',
    4: 'Gespräch',
    5: 'Monolog',
    6: 'Gebrabbel',
    8: 'Rufen / Schreien',
    13: 'Husten',
    14: 'Räuspern',
    15: 'Niesen',
    18: 'Lachen',
    137: 'Musik',
    325: 'Katze (Cat)',
    326: 'Miauen (Meow)',
    344: 'Türgeräusch',
    345: 'Klopfen',
    498: 'Stille / Hintergrund'
}

running = True
state_lock = threading.Lock()
pause_until = 0.0
current_device_name = "USB Audio"
current_total_detections = 0
current_last_detection_iso = None
current_audio_level = {'percent': 0, 'peak': 0, 'rms': 0, 'db': -60.0}

# CNN14 Globals
cnn14_session = None
cnn14_input_name = None
cnn14_labels = {}
verification_queue = queue.Queue()

def handle_signal(sig, frame):
    global running
    print(f"\n[INFO] Signal {sig} empfangen, beende Detektor sauber...")
    running = False

signal.signal(signal.SIGINT, handle_signal)
signal.signal(signal.SIGTERM, handle_signal)

def load_class_map(path):
    class_map = {}
    if os.path.exists(path):
        try:
            with open(path, 'r', encoding='utf-8') as f:
                for line in f:
                    parts = line.strip().split(',')
                    if len(parts) >= 3 and parts[0].isdigit():
                        class_map[int(parts[0])] = parts[2].strip('"')
        except Exception as e:
            print(f"[WARN] Konnte Klassennamen nicht aus {path} lesen: {e}")
    return class_map

def load_audioset_labels(path):
    labels = {}
    if os.path.exists(path):
        try:
            with open(path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith('index'):
                        continue
                    parts = line.split(',', 2)
                    if len(parts) >= 3 and parts[0].isdigit():
                        idx = int(parts[0])
                        disp_name = parts[2].strip('"')
                        labels[idx] = disp_name
        except Exception as e:
            print(f"[WARN] Konnte AudioSet Labels nicht lesen: {e}")
    return labels

def init_cnn14_model():
    """Initialisiert das PANNs CNN14 ONNX Modell für Stufe 2"""
    global cnn14_session, cnn14_input_name, cnn14_labels
    if not os.path.exists(CNN14_MODEL_PATH):
        print(f"[WARN] CNN14 Modell nicht gefunden unter {CNN14_MODEL_PATH} - Stufe 2 inaktiv.")
        return False

    print(f"[INFO] Initialisiere CNN14 ONNX Verifier ({CNN14_MODEL_PATH})...")
    try:
        t0 = time.time()
        opts = ort.SessionOptions()
        opts.intra_op_num_threads = 4
        opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        cnn14_session = ort.InferenceSession(CNN14_MODEL_PATH, opts, providers=['CPUExecutionProvider'])
        cnn14_input_name = cnn14_session.get_inputs()[0].name
        cnn14_labels = load_audioset_labels(CNN14_CLASS_MAP_PATH)
        print(f"[INFO] CNN14 Verifier erfolgreich geladen ({time.time()-t0:.2f}s, Input: {cnn14_input_name}, {len(cnn14_labels)} Klassen)")
        return True
    except Exception as e:
        print(f"[ERR] Fehler beim Laden des CNN14 Modells: {e}")
        cnn14_session = None
        return False

def find_audio_device():
    """Sucht automatisch die USB-Webcam in ALSA"""
    try:
        out = subprocess.check_output(['arecord', '-l'], text=True, stderr=subprocess.STDOUT)
        for line in out.splitlines():
            m = re.search(r'card (\d+):.*?\[(.*?)\].*?(device \d+)', line, re.IGNORECASE)
            if m:
                card_num = m.group(1)
                card_name = m.group(2)
                if re.search(r'CAM|Webcam|USB Audio', line, re.IGNORECASE):
                    return f"plughw:{card_num},0", f"{card_name} (Karte {card_num})"
        
        if "card 3:" in out:
            return "plughw:3,0", "USB Audio (Karte 3)"
    except Exception as e:
        print(f"[WARN] arecord -l Fehler: {e}")

    return "default", "Standard Audiogerät"

def load_settings():
    """Lädt persistierte Einstellungen (z.B. CNN14-Schwellenwert) aus settings.json"""
    global CNN14_CONFIRM_THRESHOLD, SENSITIVITY
    if not os.path.exists(SETTINGS_FILE):
        initial = {
            'cnn14Threshold': CNN14_CONFIRM_THRESHOLD,
            'cnn14ThresholdPct': round(CNN14_CONFIRM_THRESHOLD * 100.0, 1),
            'sensitivity': SENSITIVITY,
            'updatedAt': datetime.now().isoformat()
        }
        save_settings(initial)
        return
    try:
        with open(SETTINGS_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        if 'cnn14Threshold' in data:
            val = float(data['cnn14Threshold'])
            if val > 1.0:
                val = val / 100.0
            CNN14_CONFIRM_THRESHOLD = max(0.0, min(1.0, val))
        elif 'cnn14ThresholdPct' in data:
            val = float(data['cnn14ThresholdPct']) / 100.0
            CNN14_CONFIRM_THRESHOLD = max(0.0, min(1.0, val))
        if 'sensitivity' in data:
            SENSITIVITY = max(0.01, min(1.0, float(data['sensitivity'])))
        print(f"[INFO] Persistierte Einstellungen geladen: CNN14-Schwelle = {round(CNN14_CONFIRM_THRESHOLD*100, 1)}%, Sensitivität = {SENSITIVITY}")
    except Exception as e:
        print(f"[WARN] Konnte settings.json nicht laden: {e}")

def save_settings(settings_dict):
    """Speichert Einstellungen atomar in settings.json"""
    try:
        os.makedirs(DATA_DIR, exist_ok=True)
        tmp_file = SETTINGS_FILE + '.tmp'
        with open(tmp_file, 'w', encoding='utf-8') as f:
            json.dump(settings_dict, f, indent=2, ensure_ascii=False)
        os.replace(tmp_file, SETTINGS_FILE)
        return True
    except Exception as e:
        print(f"[ERR] Fehler beim Speichern von settings.json: {e}")
        return False

def update_status(status_str, device_name, total_detections, last_detection_str=None, audio_level=None):
    global pause_until
    os.makedirs(DATA_DIR, exist_ok=True)
    tmp_file = STATUS_FILE + '.tmp'
    
    now_t = time.time()
    is_paused = now_t < pause_until
    pause_rem = round(pause_until - now_t, 1) if is_paused else 0.0
    effective_status = "paused" if is_paused else status_str

    data = {
        'status': effective_status,
        'isPaused': is_paused,
        'pauseRemaining': pause_rem,
        'device': device_name,
        'heartbeat': datetime.now().isoformat(),
        'totalDetections': total_detections,
        'lastDetection': last_detection_str,
        'sensitivity': SENSITIVITY,
        'cnn14Active': (cnn14_session is not None),
        'cnn14Threshold': CNN14_CONFIRM_THRESHOLD,
        'audioLevel': audio_level or {'percent': 0, 'peak': 0, 'rms': 0, 'db': -60.0}
    }
    try:
        with open(tmp_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        os.replace(tmp_file, STATUS_FILE)
    except Exception as e:
        print(f"[ERR] Fehler beim Schreiben von status.json: {e}")

def save_event(event_dict):
    """Speichert ein bestätigtes Ereignis in events.json"""
    os.makedirs(DATA_DIR, exist_ok=True)
    tmp_file = EVENTS_FILE + '.tmp'
    
    with state_lock:
        events = []
        if os.path.exists(EVENTS_FILE):
            try:
                with open(EVENTS_FILE, 'r', encoding='utf-8') as f:
                    events = json.load(f)
            except Exception:
                events = []
                
        events.insert(0, event_dict)
        events = events[:200]
        
        try:
            with open(tmp_file, 'w', encoding='utf-8') as f:
                json.dump(events, f, indent=2)
            os.replace(tmp_file, EVENTS_FILE)
        except Exception as e:
            print(f"[ERR] Fehler beim Speichern des Events: {e}")

def save_wav_clip(samples_int16, filepath):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    try:
        with wave.open(filepath, 'wb') as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(SAMPLE_RATE)
            wf.writeframes(samples_int16.tobytes())
    except Exception as e:
        print(f"[ERR] Fehler beim Speichern des Audio-Clips {filepath}: {e}")

# =========================================================================
# Papierkorb-Verwaltung (Rolling Buffer: Max. 20 Clips)
# =========================================================================

def load_trash():
    if os.path.exists(TRASH_FILE):
        try:
            with open(TRASH_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if isinstance(data, list):
                    return data
        except Exception:
            pass
    return []

def save_trash(trash_list):
    tmp_file = TRASH_FILE + '.tmp'
    try:
        with open(tmp_file, 'w', encoding='utf-8') as f:
            json.dump(trash_list, f, indent=2)
        os.replace(tmp_file, TRASH_FILE)
        return True
    except Exception as e:
        print(f"[ERR] Fehler beim Schreiben von trash.json: {e}")
        return False

def move_to_trash(event_data):
    """Fügt einen verworfenen Clip zum Papierkorb hinzu (Rolling Buffer max. 20)"""
    with state_lock:
        trash = load_trash()
        trash.insert(0, event_data)

        # Wenn mehr als 20 Clips im Papierkorb sind: älteste physisch von Festplatte löschen
        while len(trash) > MAX_TRASH_ITEMS:
            evicted = trash.pop()
            audio_url = evicted.get('audioUrl', '')
            if audio_url:
                filename = os.path.basename(audio_url)
                audio_path = os.path.join(RECORDINGS_DIR, filename)
                if os.path.exists(audio_path):
                    try:
                        os.remove(audio_path)
                    except Exception:
                        pass
        save_trash(trash)

def move_event_to_trash(event_id):
    """Verschiebt ein aktives Event aus events.json in den Papierkorb"""
    global current_total_detections
    tmp_file = EVENTS_FILE + '.tmp'
    
    with state_lock:
        if not os.path.exists(EVENTS_FILE):
            return False
            
        try:
            with open(EVENTS_FILE, 'r', encoding='utf-8') as f:
                events = json.load(f)
        except Exception:
            return False
            
        deleted_event = None
        new_events = []
        for ev in events:
            if str(ev.get('id')) == str(event_id):
                deleted_event = ev
            else:
                new_events.append(ev)
                
        if deleted_event:
            try:
                with open(tmp_file, 'w', encoding='utf-8') as f:
                    json.dump(new_events, f, indent=2)
                os.replace(tmp_file, EVENTS_FILE)
                
                current_total_detections = len(new_events)
                update_status("listening", current_device_name, current_total_detections, current_last_detection_iso, current_audio_level)
                
                # In Papierkorb legen statt sofort physisch zu löschen
                deleted_event['status'] = 'rejected'
                if not deleted_event.get('reason'):
                    deleted_event['reason'] = 'Manuell in Papierkorb verschoben'
                
                # Papierkorb aktualisieren
                trash = load_trash()
                trash.insert(0, deleted_event)
                while len(trash) > MAX_TRASH_ITEMS:
                    evicted = trash.pop()
                    audio_url = evicted.get('audioUrl', '')
                    if audio_url:
                        f_ev = os.path.basename(audio_url)
                        p_ev = os.path.join(RECORDINGS_DIR, f_ev)
                        if os.path.exists(p_ev):
                            try:
                                os.remove(p_ev)
                            except Exception:
                                pass
                save_trash(trash)
                
                print(f"[INFO] Eintrag #{event_id} in den Papierkorb verschoben.")
                return True
            except Exception as e:
                print(f"[ERR] Fehler beim Verschieben in Papierkorb: {e}")
                return False
        return False

def restore_event_from_trash(event_id):
    """Stellt einen Clip aus dem Papierkorb wieder als bestätigtes Event her"""
    global current_total_detections
    with state_lock:
        trash = load_trash()
        restored_event = None
        new_trash = []
        for ev in trash:
            if str(ev.get('id')) == str(event_id):
                restored_event = ev
            else:
                new_trash.append(ev)

        if not restored_event:
            return False

        save_trash(new_trash)

        # Event als bestätigt markieren
        restored_event['status'] = 'confirmed'
        if 'cnn14' not in restored_event or not isinstance(restored_event['cnn14'], dict):
            restored_event['cnn14'] = {}
        restored_event['cnn14']['status'] = 'manually_confirmed'
        restored_event['cnn14']['className'] = restored_event.get('className', 'Manuell bestätigt')

        # In events.json einfügen
        events = []
        if os.path.exists(EVENTS_FILE):
            try:
                with open(EVENTS_FILE, 'r', encoding='utf-8') as f:
                    events = json.load(f)
            except Exception:
                events = []

        events.insert(0, restored_event)
        events = events[:200]
        tmp_file = EVENTS_FILE + '.tmp'
        try:
            with open(tmp_file, 'w', encoding='utf-8') as f:
                json.dump(events, f, indent=2)
            os.replace(tmp_file, EVENTS_FILE)
            current_total_detections = len(events)
            update_status("listening", current_device_name, current_total_detections, current_last_detection_iso, current_audio_level)
            print(f"[INFO] Eintrag #{event_id} aus Papierkorb wiederhergestellt.")
            return True
        except Exception as e:
            print(f"[ERR] Fehler beim Wiederherstellen: {e}")
            return False

def delete_single_trash_item(event_id):
    """Löscht einen Eintrag endgültig aus dem Papierkorb samt WAV-Datei"""
    with state_lock:
        trash = load_trash()
        deleted_item = None
        new_trash = []
        for ev in trash:
            if str(ev.get('id')) == str(event_id):
                deleted_item = ev
            else:
                new_trash.append(ev)

        if not deleted_item:
            return False

        save_trash(new_trash)
        audio_url = deleted_item.get('audioUrl', '')
        if audio_url:
            filename = os.path.basename(audio_url)
            audio_path = os.path.join(RECORDINGS_DIR, filename)
            if os.path.exists(audio_path):
                try:
                    os.remove(audio_path)
                except Exception:
                    pass
        print(f"[INFO] Eintrag #{event_id} endgültig aus Papierkorb gelöscht.")
        return True

def clear_trash():
    """Leert den gesamten Papierkorb und löscht alle zugehörigen WAV-Dateien"""
    with state_lock:
        trash = load_trash()
        for ev in trash:
            audio_url = ev.get('audioUrl', '')
            if audio_url:
                filename = os.path.basename(audio_url)
                audio_path = os.path.join(RECORDINGS_DIR, filename)
                if os.path.exists(audio_path):
                    try:
                        os.remove(audio_path)
                    except Exception:
                        pass
        save_trash([])
        print("[INFO] Papierkorb vollständig geleert.")
        return True

def clear_all_events():
    """Leert das aktive Protokoll dauerhaft und löscht gespeicherte WAV-Clips"""
    global current_total_detections, current_last_detection_iso
    tmp_file = EVENTS_FILE + '.tmp'
    
    with state_lock:
        try:
            with open(tmp_file, 'w', encoding='utf-8') as f:
                json.dump([], f)
            os.replace(tmp_file, EVENTS_FILE)
            
            current_total_detections = 0
            current_last_detection_iso = None
            update_status("listening", current_device_name, current_total_detections, current_last_detection_iso, current_audio_level)
            
            # Alle WAV-Aufnahmen löschen, die nicht im Papierkorb liegen
            trash = load_trash()
            trash_files = set(os.path.basename(t.get('audioUrl', '')) for t in trash if t.get('audioUrl'))
            if os.path.exists(RECORDINGS_DIR):
                for f in os.listdir(RECORDINGS_DIR):
                    if f.endswith('.wav') and f not in trash_files:
                        try:
                            os.remove(os.path.join(RECORDINGS_DIR, f))
                        except Exception:
                            pass
            print("[INFO] Beller-Protokoll dauerhaft geleert.")
            return True
        except Exception as e:
            print(f"[ERR] Fehler beim Leeren des Protokolls: {e}")
            return False

# =========================================================================
# 7-Tage Audio Retention Policy (Audiodateien nach 7 Tagen bereinigen)
# =========================================================================

def cleanup_old_recordings():
    """
    Löscht Audio-Aufnahmen (.wav), die älter als 7 Tage sind, um Speicherplatz zu sparen.
    Die statistischen Daten in events.json bleiben dauerhaft erhalten!
    Clips im Papierkorb (trash.json) werden separat über den 20-Clip-Puffer verwaltet.
    """
    with state_lock:
        if not os.path.exists(EVENTS_FILE):
            return 0
        try:
            with open(EVENTS_FILE, 'r', encoding='utf-8') as f:
                events = json.load(f)
        except Exception as e:
            print(f"[WARN] Fehler beim Laden von events.json in cleanup: {e}")
            return 0

        # Papierkorb-Dateien ermitteln (werden nicht vorzeitig gelöscht)
        trash = load_trash()
        trash_files = set(os.path.basename(t.get('audioUrl', '')) for t in trash if t.get('audioUrl'))

        now_t = time.time()
        cutoff_t = now_t - (7 * 86400) # 7 Tage
        modified = False
        deleted_count = 0

        for ev in events:
            ts = ev.get('timestamp')
            if not ts:
                continue
            try:
                ev_t = datetime.fromisoformat(ts).timestamp()
            except Exception:
                continue

            if ev_t < cutoff_t:
                audio_url = ev.get('audioUrl')
                if audio_url:
                    fname = os.path.basename(audio_url)
                    if fname not in trash_files:
                        fpath = os.path.join(RECORDINGS_DIR, fname)
                        if os.path.exists(fpath):
                            try:
                                os.remove(fpath)
                                deleted_count += 1
                            except Exception:
                                pass
                    ev['audioUrl'] = None
                    ev['audioExpired'] = True
                    modified = True

        if modified:
            tmp_file = EVENTS_FILE + '.tmp'
            try:
                with open(tmp_file, 'w', encoding='utf-8') as f:
                    json.dump(events, f, indent=2)
                os.replace(tmp_file, EVENTS_FILE)
            except Exception as e:
                print(f"[ERR] Fehler beim Speichern von events.json nach Cleanup: {e}")

        if deleted_count > 0:
            print(f"[INFO] 7-Tage-Retention: {deleted_count} alte Audio-Dateien gelöscht (Statistik bleibt erhalten).")

        return deleted_count

# =========================================================================
# Filou KI-Trainer & Active Learning (Stufe 3: Personalisiertes Stimmprofil)
# =========================================================================

filou_profile_cache = None

def extract_audio_fingerprint_from_samples(samples_f32, cnn14_probs=None):
    """
    Extrahiert einen kompakten, normalisierten Merkmalsvektor (96-dimensional)
    aus dem PCM-Audiosignal und den CNN14-Wahrscheinlichkeiten:
      - 32 Bänder: FFT-Energiespektrum (Frequenzverteilung)
      - 32 Bänder: zeitliche Energie-Hüllkurve
      - 32 Werte: Top-Klassen und hundespezifische Wahrscheinlichkeiten
    """
    try:
        if samples_f32 is None or len(samples_f32) == 0:
            return None

        # 1. FFT-Spektrum (32 Frequenzbänder)
        fft_len = min(2048, len(samples_f32))
        windowed = samples_f32[:fft_len] * np.hanning(fft_len)
        fft_vals = np.abs(np.fft.rfft(windowed))
        band_size = max(1, len(fft_vals) // 32)
        fft_bands = np.array([np.mean(fft_vals[i*band_size:(i+1)*band_size]) for i in range(32)], dtype=np.float32)
        norm_fft = np.linalg.norm(fft_bands)
        if norm_fft > 1e-6:
            fft_bands = fft_bands / norm_fft

        # 2. Zeitliche Energieverteilung (32 Segmente)
        seg_len = max(1, len(samples_f32) // 32)
        env = np.array([np.sqrt(np.mean(samples_f32[i*seg_len:(i+1)*seg_len]**2)) for i in range(32)], dtype=np.float32)
        norm_env = np.linalg.norm(env)
        if norm_env > 1e-6:
            env = env / norm_env

        # 3. CNN14 Signatur (32 Werte)
        if cnn14_probs is not None and len(cnn14_probs) >= 527:
            selected_indices = [
                75, 76, 73, 72, 71, 74, 77, 78,
                0, 1, 2, 3,
                300, 301, 302, 303,
                450, 451, 452, 453,
                60, 61, 62, 63,
                100, 101, 102, 103, 104, 105, 106, 107
            ][:32]
            cnn_features = np.array([float(cnn14_probs[i]) if i < len(cnn14_probs) else 0.0 for i in selected_indices], dtype=np.float32)
            norm_cnn = np.linalg.norm(cnn_features)
            if norm_cnn > 1e-6:
                cnn_features = cnn_features / norm_cnn
        else:
            cnn_features = np.zeros(32, dtype=np.float32)

        feature_vec = np.concatenate([fft_bands, env, cnn_features])
        vec_norm = np.linalg.norm(feature_vec)
        if vec_norm > 1e-6:
            feature_vec = feature_vec / vec_norm
        return feature_vec.tolist()
    except Exception as e:
        print(f"[WARN] Fehler bei Merkmalsextraktion: {e}")
        return None

def extract_audio_fingerprint_from_file(wav_path, cnn14_probs=None):
    """Liest eine WAV-Datei ein und extrahiert den Merkmalsvektor"""
    try:
        if not os.path.exists(wav_path):
            return None
        with wave.open(wav_path, 'rb') as wf:
            n_channels = wf.getnchannels()
            sampwidth = wf.getsampwidth()
            frames = wf.readframes(wf.getnframes())

        if sampwidth == 2:
            samples = np.frombuffer(frames, dtype=np.int16).astype(np.float32) / 32768.0
        else:
            samples = np.frombuffer(frames, dtype=np.float32)

        if n_channels > 1:
            samples = samples[::n_channels]

        return extract_audio_fingerprint_from_samples(samples, cnn14_probs)
    except Exception as e:
        print(f"[WARN] Fehler beim Einlesen von {wav_path}: {e}")
        return None

def load_filou_profile():
    global filou_profile_cache
    if filou_profile_cache is not None:
        return filou_profile_cache
    if os.path.exists(FILOU_PROFILE_FILE):
        try:
            with open(FILOU_PROFILE_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                filou_profile_cache = data
                return data
        except Exception:
            pass
    default_profile = {
        "active": False,
        "total_barks": 0,
        "total_noise": 0,
        "bark_exemplars": [],
        "noise_exemplars": [],
        "updated_at": None
    }
    filou_profile_cache = default_profile
    return default_profile

def save_filou_profile(profile):
    global filou_profile_cache
    filou_profile_cache = profile
    tmp_file = FILOU_PROFILE_FILE + '.tmp'
    try:
        with open(tmp_file, 'w', encoding='utf-8') as f:
            json.dump(profile, f, indent=2)
        os.replace(tmp_file, FILOU_PROFILE_FILE)
        return True
    except Exception as e:
        print(f"[ERR] Fehler beim Speichern von filou_profile.json: {e}")
        return False

def load_labeled_dataset():
    if os.path.exists(TRAINER_DATASET_FILE):
        try:
            with open(TRAINER_DATASET_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if isinstance(data, list):
                    return data
        except Exception:
            pass
    return []

def save_labeled_dataset(dataset):
    tmp_file = TRAINER_DATASET_FILE + '.tmp'
    try:
        with open(tmp_file, 'w', encoding='utf-8') as f:
            json.dump(dataset, f, indent=2)
        os.replace(tmp_file, TRAINER_DATASET_FILE)
        return True
    except Exception as e:
        print(f"[ERR] Fehler beim Speichern von labeled_dataset.json: {e}")
        return False

def rebuild_filou_profile():
    """Berechnet das Stimmprofil aus dem gelabelten Datensatz neu"""
    dataset = load_labeled_dataset()
    bark_exemplars = []
    noise_exemplars = []

    for item in dataset:
        vec = item.get("feature_vec")
        if not vec or len(vec) != 96:
            continue
        if item.get("label") == "bark":
            bark_exemplars.append(vec)
        elif item.get("label") == "noise":
            noise_exemplars.append(vec)

    # Begrenzung auf maximal 50 Exemplare (jüngste) für maximale Inferenz-Geschwindigkeit
    bark_exemplars = bark_exemplars[-50:]
    noise_exemplars = noise_exemplars[-50:]

    profile = {
        "active": (len(bark_exemplars) > 0 or len(noise_exemplars) > 0),
        "total_barks": len([x for x in dataset if x.get("label") == "bark"]),
        "total_noise": len([x for x in dataset if x.get("label") == "noise"]),
        "bark_exemplars": bark_exemplars,
        "noise_exemplars": noise_exemplars,
        "updated_at": datetime.now().isoformat()
    }
    save_filou_profile(profile)
    print(f"[TRAINER] 🧠 Filou-KI-Profil aktualisiert: {len(bark_exemplars)} Beller-Muster, {len(noise_exemplars)} Fehlalarm-Muster.")
    return profile

def evaluate_filou_match(feature_vec):
    """
    Gleicht einen Merkmalsvektor mit dem gelernten Filou-Stimmprofil ab.
    Gibt (filou_match_score, noise_match_score, is_filou_match) zurück.
    """
    if not feature_vec:
        return 0.0, 0.0, False

    profile = load_filou_profile()
    if not profile.get("active"):
        return 0.0, 0.0, False

    bark_exs = profile.get("bark_exemplars", [])
    noise_exs = profile.get("noise_exemplars", [])

    if not bark_exs and not noise_exs:
        return 0.0, 0.0, False

    vec = np.array(feature_vec, dtype=np.float32)
    norm = np.linalg.norm(vec)
    if norm > 1e-6:
        vec = vec / norm
    else:
        return 0.0, 0.0, False

    max_filou_sim = 0.0
    if bark_exs:
        b_sims = [float(np.dot(vec, np.array(ex, dtype=np.float32))) for ex in bark_exs]
        max_filou_sim = max(b_sims) if b_sims else 0.0

    max_noise_sim = 0.0
    if noise_exs:
        n_sims = [float(np.dot(vec, np.array(ex, dtype=np.float32))) for ex in noise_exs]
        max_noise_sim = max(n_sims) if n_sims else 0.0

    # Match-Kriterium: Mindestens 70% Ähnlichkeit zu Filous Stimme und größer als Noise-Ähnlichkeit
    is_filou = (max_filou_sim >= 0.70 and max_filou_sim > max_noise_sim)
    return max_filou_sim, max_noise_sim, is_filou

# =========================================================================
# CNN14 Inferenz & Asynchroner Verifikations-Worker
# =========================================================================

def run_cnn14_inference(pcm_16k_samples):
    """Führt Inferenz mit PANNs CNN14 auf einem Audio-Clip durch"""
    if cnn14_session is None:
        return {
            'status': 'confirmed',
            'is_confirmed': True,
            'className': 'YAMNet (CNN14 inaktiv)',
            'classIdx': 75,
            'confidence': 1.0,
            'confidencePct': '100.0',
            'dogConfidencePct': '100.0',
            'topClass': 'CNN14 nicht geladen'
        }

    try:
        if pcm_16k_samples.dtype == np.int16:
            samples_f32 = pcm_16k_samples.astype(np.float32) / 32768.0
        else:
            samples_f32 = pcm_16k_samples.astype(np.float32)

        # 2x Resampling: 16kHz -> 32kHz (lineare Interpolation)
        n_src = len(samples_f32)
        n_dst = n_src * 2
        x_src = np.linspace(0, 1, n_src, endpoint=False)
        x_dst = np.linspace(0, 1, n_dst, endpoint=False)
        samples_32k = np.interp(x_dst, x_src, samples_f32).astype(np.float32)

        # In 5-Sekunden-Fenster (160000 Samples bei 32kHz) kacheln, damit das rezeptive Feld optimal bewertet wird
        if len(samples_32k) < 160000:
            repeats = int(np.ceil(160000 / max(1, len(samples_32k))))
            wave_input = np.tile(samples_32k, repeats)[:160000].reshape(1, 160000).astype(np.float32)
        else:
            wave_input = samples_32k[:160000].reshape(1, 160000).astype(np.float32)

        # ONNX Inferenz ausführen
        outs = cnn14_session.run(None, {cnn14_input_name: wave_input})
        probs = outs[0][0]  # Array (527,)

        # 3. Filou Active Learning Stimm- & Fehlalarm-Abgleich
        filou_features = extract_audio_fingerprint_from_samples(samples_f32, probs)
        filou_sim, noise_sim, is_filou_voice = evaluate_filou_match(filou_features)

        # Höchste Hundeklasse ermitteln
        best_dog_idx = 75  # Default: Bark
        best_dog_score = 0.0
        for c_idx in CNN14_DOG_INDICES:
            s = float(probs[c_idx])
            if s > best_dog_score:
                best_dog_score = s
                best_dog_idx = c_idx

        # Adaptiver Filou-Stimm-Boost
        original_dog_score = best_dog_score
        if is_filou_voice:
            boost = (filou_sim - 0.65) * 0.4
            best_dog_score = min(1.0, best_dog_score + max(0.0, boost))

        # Top 3 allgemeine Klassen zur Erklärung
        top_indices = np.argsort(probs)[::-1][:3]
        top_overall_idx = int(top_indices[0])
        top_overall_score = float(probs[top_overall_idx])
        top_overall_name = AUDIOSET_DE_NAMES.get(top_overall_idx, cnn14_labels.get(top_overall_idx, f"Klasse {top_overall_idx}"))

        # Fehlalarm-Unterdrückung wenn stark mit gelernten Fehlalarmen übereinstimmend
        if noise_sim >= 0.85 and noise_sim > filou_sim + 0.15:
            best_dog_score = max(0.0, best_dog_score - 0.35)
            top_overall_name = f"Gelernter Fehlalarm ({round(noise_sim * 100, 1)}%)"

        dog_name = AUDIOSET_DE_NAMES.get(best_dog_idx, cnn14_labels.get(best_dog_idx, "Bellen"))

        # Bestätigungskriterium:
        # 1. Hundekonfidenz >= CNN14_CONFIRM_THRESHOLD (z.B. 0.20)
        # ODER 2. Die absolut höchste erkannte Klasse ist ein Hundelaut
        # ODER 3. Hohe Übereinstimmung mit Filous Stimmprofil (>= 80%)
        is_dog_top = (top_overall_idx in CNN14_DOG_INDICES)
        is_confirmed = (best_dog_score >= CNN14_CONFIRM_THRESHOLD) or is_dog_top or (is_filou_voice and filou_sim >= 0.80)

        dog_conf_pct = round(best_dog_score * 100, 1)

        return {
            'status': 'confirmed' if is_confirmed else 'rejected',
            'is_confirmed': is_confirmed,
            'className': dog_name if is_confirmed else top_overall_name,
            'classIdx': best_dog_idx if is_confirmed else top_overall_idx,
            'confidence': round(best_dog_score, 4),
            'confidencePct': str(dog_conf_pct),
            'dogConfidencePct': str(dog_conf_pct),
            'topClass': f"{top_overall_name} ({round(top_overall_score * 100, 1)}%)",
            'filouProfile': {
                'active': bool(filou_sim > 0 or noise_sim > 0),
                'filouMatchPct': round(filou_sim * 100, 1),
                'noiseMatchPct': round(noise_sim * 100, 1),
                'isFilouMatch': bool(is_filou_voice),
                'boosted': bool(best_dog_score > original_dog_score)
            }
        }
    except Exception as e:
        print(f"[ERR] Fehler in run_cnn14_inference: {e}")
        return {
            'status': 'error',
            'is_confirmed': False,
            'className': 'Inferenzfehler',
            'classIdx': -1,
            'confidence': 0.0,
            'confidencePct': '0.0',
            'dogConfidencePct': '0.0',
            'topClass': str(e)
        }

def cnn14_worker_loop():
    """Hintergrund-Worker zur asynchronen Prüfung von YAMNet-Kandidaten"""
    global current_total_detections, current_last_detection_iso
    print("[INFO] CNN14 Verifier-Worker bereit. Wartet auf YAMNet-Kandidaten...")
    while running:
        try:
            item = verification_queue.get(timeout=1.0)
        except queue.Empty:
            continue

        try:
            event_data = item['event_data']
            pcm_samples = item['pcm_samples']

            t_start = time.time()
            cnn_res = run_cnn14_inference(pcm_samples)
            dur = time.time() - t_start

            cnn_res['duration'] = round(dur, 2)
            cnn_res['durationMs'] = int(dur * 1000)
            cnn_res['inferenceTimeStr'] = f"{dur:.2f}s"
            event_data['cnn14'] = cnn_res

            if cnn_res['is_confirmed']:
                event_data['status'] = 'confirmed'
                event_data['className'] = cnn_res['className']
                event_data['confidencePct'] = cnn_res['confidencePct']
                
                save_event(event_data)
                current_total_detections += 1
                current_last_detection_iso = event_data['timestamp']
                update_status("listening", current_device_name, current_total_detections, current_last_detection_iso, current_audio_level)
                print(f"[CNN14] ✅ BESTÄTIGT #{event_data['id']}: {cnn_res['className']} ({cnn_res['confidencePct']}%) in {dur:.2f}s [YAMNet: {event_data['yamnet']['confidencePct']}%]")
            else:
                event_data['status'] = 'rejected'
                event_data['reason'] = f"Von CNN14 als Fehlalarm verworfen: {cnn_res['topClass']}"
                move_to_trash(event_data)
                print(f"[CNN14] ❌ VERWORFEN #{event_data['id']}: Fehlalarm -> {cnn_res['topClass']} in {dur:.2f}s (in Papierkorb) [YAMNet: {event_data['yamnet']['confidencePct']}%]")
        except Exception as e:
            print(f"[ERR] Fehler bei CNN14-Verifikation: {e}")
        finally:
            verification_queue.task_done()

# =========================================================================
# REST-API Server
# =========================================================================

class ApiHandler(BaseHTTPRequestHandler):
    """Schlanker REST-Endpunkt für Protokoll- & Papierkorb-Aktionen"""
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        qs = parse_qs(parsed.query)

        if path in ['/api/trash', '/api/events/trash']:
            trash_data = load_trash()
            self._json_response(trash_data)
        elif path in ['/api/settings']:
            self._json_response({
                'success': True,
                'cnn14Threshold': round(CNN14_CONFIRM_THRESHOLD, 4),
                'cnn14ThresholdPct': round(CNN14_CONFIRM_THRESHOLD * 100.0, 1),
                'sensitivity': SENSITIVITY
            })
        elif path in ['/api/trainer/queue']:
            source_filter = qs.get('source', ['all'])[0]
            labeled_data = load_labeled_dataset()
            labeled_ids = set(str(d.get('id')) for d in labeled_data)

            trash = load_trash()
            trash_items = []
            for item in trash:
                item_id = str(item.get('id'))
                if item_id in labeled_ids or item.get('reviewed'):
                    continue
                audio_url = item.get('audioUrl', '')
                if not audio_url:
                    continue
                filename = os.path.basename(audio_url)
                filepath = os.path.join(RECORDINGS_DIR, filename)
                if os.path.exists(filepath):
                    trash_items.append({
                        'id': item_id,
                        'source': 'trash',
                        'sourceLabel': 'Papierkorb (vom Vorfilter verworfen)',
                        'timestamp': item.get('timestamp'),
                        'dateFormatted': item.get('dateFormatted'),
                        'timeFormatted': item.get('timeFormatted'),
                        'audioUrl': audio_url,
                        'yamnet': item.get('yamnet', {}),
                        'cnn14': item.get('cnn14', {}),
                        'reason': item.get('reason', 'Von CNN14 verworfen')
                    })

            events_items = []
            if os.path.exists(EVENTS_FILE):
                try:
                    with open(EVENTS_FILE, 'r', encoding='utf-8') as f:
                        evs = json.load(f)
                except Exception:
                    evs = []
                for ev in evs:
                    ev_id = str(ev.get('id'))
                    if ev_id in labeled_ids or ev.get('reviewed'):
                        continue
                    audio_url = ev.get('audioUrl', '')
                    if not audio_url:
                        continue
                    filename = os.path.basename(audio_url)
                    filepath = os.path.join(RECORDINGS_DIR, filename)
                    if os.path.exists(filepath):
                        events_items.append({
                            'id': ev_id,
                            'source': 'events',
                            'sourceLabel': 'Beller-Protokoll (Bestätigt)',
                            'timestamp': ev.get('timestamp'),
                            'dateFormatted': ev.get('dateFormatted'),
                            'timeFormatted': ev.get('timeFormatted'),
                            'audioUrl': audio_url,
                            'yamnet': ev.get('yamnet', {}),
                            'cnn14': ev.get('cnn14', {}),
                            'reason': 'Vom System als Beller erkannt'
                        })

            if source_filter == 'trash':
                queue_items = trash_items
            elif source_filter == 'events':
                queue_items = events_items
            else:
                # 'all': Zuerst verworfene Clips (höchster Trainingswert für Fehlalarme), danach Protokoll-Beller
                queue_items = trash_items + events_items

            profile = load_filou_profile()
            is_active = profile.get('active', False)

            # Live KI-Vorhersage berechnen (begrenzt auf die ersten 50 für maximale Performance)
            for item in queue_items[:50]:
                audio_url = item.get('audioUrl', '')
                filename = os.path.basename(audio_url)
                filepath = os.path.join(RECORDINGS_DIR, filename)
                vec = None
                try:
                    vec = extract_audio_fingerprint_from_file(filepath)
                except Exception:
                    pass

                if vec and is_active:
                    f_sim, n_sim, is_filou = evaluate_filou_match(vec)
                    f_pct = round(f_sim * 100.0, 1)
                    n_pct = round(n_sim * 100.0, 1)

                    if is_filou:
                        item['aiPrediction'] = {
                            'suggestedLabel': 'bark',
                            'label': f"Filou ({f_pct}%)",
                            'detail': f"🎯 Stimmprofil erkannt: {f_pct}% Übereinstimmung mit Filou",
                            'badgeType': 'success',
                            'filouPct': f_pct,
                            'noisePct': n_pct
                        }
                    elif n_sim >= 0.75 and n_sim > f_sim:
                        item['aiPrediction'] = {
                            'suggestedLabel': 'noise',
                            'label': f"Fehlalarm ({n_pct}%)",
                            'detail': f"🛡️ Erkannt als Fehlalarm ({n_pct}% Ähnlichkeit zu gelerntem Geräusch)",
                            'badgeType': 'danger',
                            'filouPct': f_pct,
                            'noisePct': n_pct
                        }
                    elif f_sim >= 0.55:
                        item['aiPrediction'] = {
                            'suggestedLabel': 'bark',
                            'label': f"Tendenziell Filou ({f_pct}%)",
                            'detail': f"Akustische Ähnlichkeit zu Filou: {f_pct}%",
                            'badgeType': 'warning',
                            'filouPct': f_pct,
                            'noisePct': n_pct
                        }
                    else:
                        item['aiPrediction'] = {
                            'suggestedLabel': 'uncertain',
                            'label': "Noch unsicher",
                            'detail': "Noch zu wenige ähnliche Vergleichsmuster gelernt",
                            'badgeType': 'muted',
                            'filouPct': f_pct,
                            'noisePct': n_pct
                        }
                else:
                    item['aiPrediction'] = {
                        'suggestedLabel': 'uncertain',
                        'label': "Basis-Modell",
                        'detail': "Modell lernt mit jeder deiner Bewertungen",
                        'badgeType': 'muted',
                        'filouPct': 0,
                        'noisePct': 0
                    }

            self._json_response({
                'success': True,
                'queue': queue_items,
                'total': len(queue_items),
                'counts': {
                    'all': len(trash_items) + len(events_items),
                    'trash': len(trash_items),
                    'events': len(events_items)
                }
            })
        elif path in ['/api/trainer/stats']:
            profile = load_filou_profile()
            dataset = load_labeled_dataset()
            labeled_ids = set(str(d.get('id')) for d in dataset)

            trash = load_trash()
            unreviewed_trash = [t for t in trash if str(t.get('id')) not in labeled_ids and not t.get('reviewed')]

            unreviewed_events = 0
            if os.path.exists(EVENTS_FILE):
                try:
                    with open(EVENTS_FILE, 'r', encoding='utf-8') as f:
                        evs = json.load(f)
                        unreviewed_events = len([e for e in evs if str(e.get('id')) not in labeled_ids and not e.get('reviewed')])
                except Exception:
                    pass

            total_barks = profile.get('total_barks', 0)
            total_noise = profile.get('total_noise', 0)
            total_labeled = total_barks + total_noise

            # Modell-Reifegrad (Training Level)
            if total_labeled < 10:
                level_num = 1
                level_name = "Level 1: Basis-Modell"
                level_next = "Level 2: Kalibriert"
                level_target = 10
                level_progress = round((total_labeled / 10.0) * 100)
            elif total_labeled < 25:
                level_num = 2
                level_name = "Level 2: Kalibriert"
                level_next = "Level 3: Fortgeschritten"
                level_target = 25
                level_progress = round(((total_labeled - 10) / 15.0) * 100)
            elif total_labeled < 50:
                level_num = 3
                level_name = "Level 3: Fortgeschritten"
                level_next = "Level 4: Profi-Stimmprofil"
                level_target = 50
                level_progress = round(((total_labeled - 25) / 25.0) * 100)
            else:
                level_num = 4
                level_name = "Level 4: Profi-Stimmprofil"
                level_next = "Maximalstufe erreicht"
                level_target = total_labeled
                level_progress = 100

            # Historie nach Tagen gruppiert (für Lernkurven-Visualisierung)
            history_days = {}
            for item in dataset:
                ts = item.get('labeled_at') or item.get('timestamp')
                if ts:
                    day_key = ts[:10]
                    if day_key not in history_days:
                        history_days[day_key] = {'date': day_key, 'barks': 0, 'noise': 0, 'total': 0}
                    if item.get('label') == 'bark':
                        history_days[day_key]['barks'] += 1
                    else:
                        history_days[day_key]['noise'] += 1
                    history_days[day_key]['total'] += 1

            history_sorted = [v for k, v in sorted(history_days.items())]

            # Modell-Trennschärfe / Zuverlässigkeit (50% Basis bis 96% bei vollem Profil)
            discrimination_pct = min(96, round(52 + (min(total_barks, 25) * 1.2) + (min(total_noise, 15) * 0.9)))

            self._json_response({
                'success': True,
                'totalBarks': total_barks,
                'totalNoise': total_noise,
                'totalLabeled': total_labeled,
                'profileActive': profile.get('active', False),
                'queueLength': len(unreviewed_trash) + unreviewed_events,
                'queueCounts': {
                    'all': len(unreviewed_trash) + unreviewed_events,
                    'trash': len(unreviewed_trash),
                    'events': unreviewed_events
                },
                'level': {
                    'num': level_num,
                    'name': level_name,
                    'next': level_next,
                    'target': level_target,
                    'progressPct': level_progress
                },
                'discriminationPct': discrimination_pct,
                'history': history_sorted,
                'updatedAt': profile.get('updated_at')
            })
        else:
            self._json_response({'error': 'Nicht gefunden'}, status=404)

    def do_POST(self):
        global pause_until
        parsed = urlparse(self.path)
        path = parsed.path
        qs = parse_qs(parsed.query)

        if path in ['/api/clear', '/api/events/clear']:
            success = clear_all_events()
            self._json_response({'success': success, 'message': 'Protokoll geleert'})
        elif path in ['/api/pause']:
            try:
                dur = float(qs.get('duration', [6.0])[0])
            except Exception:
                dur = 6.0
            dur = max(1.0, min(dur, 60.0))
            with state_lock:
                pause_until = time.time() + dur
                update_status("paused", current_device_name, current_total_detections, current_last_detection_iso, current_audio_level)
            print(f"[INFO] Audio-Erkennung für {dur}s pausiert (Wiedergabe aktiv)")
            self._json_response({'success': True, 'isPaused': True, 'pauseRemaining': dur})
        elif path in ['/api/resume']:
            with state_lock:
                pause_until = 0.0
                update_status("listening", current_device_name, current_total_detections, current_last_detection_iso, current_audio_level)
            print("[INFO] Audio-Erkennung fortgesetzt (Wiedergabe beendet)")
            self._json_response({'success': True, 'isPaused': False})
        elif path in ['/api/delete', '/api/events/delete']:
            event_id = qs.get('id', [None])[0]
            if not event_id and self.headers.get('Content-Length'):
                try:
                    length = int(self.headers['Content-Length'])
                    body = json.loads(self.rfile.read(length).decode('utf-8'))
                    event_id = body.get('id')
                except Exception:
                    pass
            if event_id:
                success = move_event_to_trash(str(event_id))
                self._json_response({'success': success, 'id': str(event_id), 'movedToTrash': True})
            else:
                self._json_response({'success': False, 'error': 'ID fehlt'}, status=400)
        elif path in ['/api/cleanup', '/api/events/cleanup']:
            del_cnt = cleanup_old_recordings()
            self._json_response({'success': True, 'deletedCount': del_cnt, 'retentionDays': 7})
        elif path in ['/api/settings']:
            global CNN14_CONFIRM_THRESHOLD, SENSITIVITY
            thr_str = qs.get('cnn14Threshold', [None])[0]
            sens_str = qs.get('sensitivity', [None])[0]
            if not thr_str and self.headers.get('Content-Length'):
                try:
                    length = int(self.headers['Content-Length'])
                    body = json.loads(self.rfile.read(length).decode('utf-8'))
                    thr_str = body.get('cnn14Threshold') or body.get('cnn14ThresholdPct')
                    sens_str = body.get('sensitivity')
                except Exception:
                    pass

            if thr_str is not None:
                try:
                    val = float(thr_str)
                    if val > 1.0:
                        val = val / 100.0
                    if 0.0 <= val <= 1.0:
                        CNN14_CONFIRM_THRESHOLD = val
                        print(f"[INFO] CNN14 Schwellenwert auf {round(val*100, 1)}% fest im Programm gespeichert.")
                except Exception as e:
                    print(f"[WARN] Ungültiger CNN14 Schwellenwert: {e}")

            if sens_str is not None:
                try:
                    val = float(sens_str)
                    if 0.0 <= val <= 1.0:
                        SENSITIVITY = val
                except Exception:
                    pass

            settings_payload = {
                'success': True,
                'cnn14Threshold': round(CNN14_CONFIRM_THRESHOLD, 4),
                'cnn14ThresholdPct': round(CNN14_CONFIRM_THRESHOLD * 100.0, 1),
                'sensitivity': SENSITIVITY,
                'updatedAt': datetime.now().isoformat()
            }
            save_settings(settings_payload)
            update_status("listening", current_device_name, current_total_detections, current_last_detection_iso, current_audio_level)
            self._json_response(settings_payload)
        elif path in ['/api/trash/restore']:
            event_id = qs.get('id', [None])[0]
            if event_id:
                success = restore_event_from_trash(str(event_id))
                self._json_response({'success': success, 'id': str(event_id)})
            else:
                self._json_response({'success': False, 'error': 'ID fehlt'}, status=400)
        elif path in ['/api/trash/delete']:
            event_id = qs.get('id', [None])[0]
            if event_id:
                success = delete_single_trash_item(str(event_id))
                self._json_response({'success': success, 'id': str(event_id)})
            else:
                self._json_response({'success': False, 'error': 'ID fehlt'}, status=400)
        elif path in ['/api/trash/clear']:
            success = clear_trash()
            self._json_response({'success': success, 'message': 'Papierkorb geleert'})
        elif path in ['/api/trainer/label']:
            event_id = qs.get('id', [None])[0]
            label = qs.get('label', [None])[0]
            if (not event_id or not label) and self.headers.get('Content-Length'):
                try:
                    length = int(self.headers['Content-Length'])
                    body = json.loads(self.rfile.read(length).decode('utf-8'))
                    event_id = body.get('id')
                    label = body.get('label')
                except Exception:
                    pass

            if not event_id or label not in ['bark', 'noise']:
                self._json_response({'success': False, 'error': 'id und valides label (bark|noise) erforderlich'}, status=400)
                return

            event_id = str(event_id)
            trash = load_trash()
            target_event = None
            is_from_trash = False

            for ev in trash:
                if str(ev.get('id')) == event_id:
                    target_event = ev
                    is_from_trash = True
                    break

            if not target_event and os.path.exists(EVENTS_FILE):
                try:
                    with open(EVENTS_FILE, 'r', encoding='utf-8') as f:
                        evs = json.load(f)
                        for ev in evs:
                            if str(ev.get('id')) == event_id:
                                target_event = ev
                                break
                except Exception:
                    pass

            if not target_event:
                self._json_response({'success': False, 'error': 'Ereignis nicht gefunden'}, status=404)
                return

            audio_url = target_event.get('audioUrl', '')
            filename = os.path.basename(audio_url) if audio_url else f"bark_{event_id}.wav"
            src_audio_path = os.path.join(RECORDINGS_DIR, filename)

            feature_vec = None
            if os.path.exists(src_audio_path):
                feature_vec = extract_audio_fingerprint_from_file(src_audio_path)
                dst_dir = DATASET_BARKS_DIR if label == 'bark' else DATASET_NOISE_DIR
                os.makedirs(dst_dir, exist_ok=True)
                dst_path = os.path.join(dst_dir, filename)
                try:
                    shutil.copy2(src_audio_path, dst_path)
                except Exception as e:
                    print(f"[WARN] Konnte Audio nicht ins Dataset kopieren: {e}")

            dataset = load_labeled_dataset()
            dataset = [d for d in dataset if str(d.get('id')) != event_id]
            dataset.append({
                'id': event_id,
                'label': label,
                'timestamp': target_event.get('timestamp'),
                'labeled_at': datetime.now().isoformat(),
                'audio_file': filename,
                'feature_vec': feature_vec,
                'yamnet': target_event.get('yamnet'),
                'cnn14': target_event.get('cnn14')
            })
            save_labeled_dataset(dataset)

            if is_from_trash:
                if label == 'bark':
                    restore_event_from_trash(event_id)
                else:
                    for ev in trash:
                        if str(ev.get('id')) == event_id:
                            ev['reviewed'] = True
                            ev['userLabel'] = 'noise'
                    save_trash(trash)
            else:
                if label == 'noise':
                    move_event_to_trash(event_id)
                else:
                    if os.path.exists(EVENTS_FILE):
                        try:
                            with open(EVENTS_FILE, 'r', encoding='utf-8') as f:
                                ev_list = json.load(f)
                            for ev in ev_list:
                                if str(ev.get('id')) == event_id:
                                    ev['reviewed'] = True
                                    ev['userLabel'] = 'bark'
                            tmp = EVENTS_FILE + '.tmp'
                            with open(tmp, 'w', encoding='utf-8') as f:
                                json.dump(ev_list, f, indent=2)
                            os.replace(tmp, EVENTS_FILE)
                        except Exception as e:
                            print(f"[WARN] Konnte reviewed-Flag in events.json nicht setzen: {e}")

            profile = rebuild_filou_profile()

            self._json_response({
                'success': True,
                'id': event_id,
                'label': label,
                'stats': {
                    'totalBarks': profile.get('total_barks', 0),
                    'totalNoise': profile.get('total_noise', 0),
                    'profileActive': profile.get('active', False)
                }
            })
        else:
            self._json_response({'error': 'Nicht gefunden'}, status=404)

    def _json_response(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def log_message(self, format, *args):
        pass  # Keine stdout-Flutung durch Polling

def start_api_server():
    server = ThreadingHTTPServer(('0.0.0.0', 5001), ApiHandler)
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()
    print("[INFO] API-Server läuft auf Port 5001 (/api/trash, /api/clear, /api/delete)")

# =========================================================================
# Hauptprogramm (Audio-Erfassung & YAMNet Vorfilter)
# =========================================================================

def main():
    global current_device_name, current_total_detections, current_last_detection_iso, current_audio_level
    os.makedirs(RECORDINGS_DIR, exist_ok=True)
    
    # Persistierte Einstellungen laden (CNN14-Schwelle etc.)
    load_settings()

    # API-Server starten
    start_api_server()

    # CNN14 Verifier initialisieren & Worker starten
    cnn14_ready = init_cnn14_model()
    worker_thread = threading.Thread(target=cnn14_worker_loop, daemon=True)
    worker_thread.start()
    
    print("[INFO] Initialisiere YAMNet TFLite Vorfilter...")
    interpreter = tflite.Interpreter(model_path=MODEL_PATH)
    interpreter.allocate_tensors()
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()
    
    input_index = input_details[0]['index']
    output_index = output_details[0]['index']
    print(f"[INFO] YAMNet Modell bereit. Input Index: {input_index}, Output Index: {output_index}")
    
    class_map = load_class_map(CLASS_MAP_PATH)
    device_arg, current_device_name = find_audio_device()
    print(f"[INFO] Verwende Audio-Eingang: {device_arg} ({current_device_name})")
    
    # Vorhandene bestätigte Ereignisse zählen
    if os.path.exists(EVENTS_FILE):
        try:
            with open(EVENTS_FILE, 'r', encoding='utf-8') as f:
                evs = json.load(f)
                current_total_detections = len(evs)
                if evs and 'timestamp' in evs[0]:
                    current_last_detection_iso = evs[0]['timestamp']
        except Exception:
            pass

    # 7-Tage-Retention für Audio-Clips beim Start ausführen (Statistiken bleiben dauerhaft erhalten)
    cleanup_old_recordings()
    last_retention_check = time.time()

    update_status("running", current_device_name, current_total_detections, current_last_detection_iso)
    
    # Ringpuffer für Audio-Wiedergabe (2.5 Sekunden)
    ring_buffer = np.zeros(RING_BUFFER_SAMPLES, dtype=np.int16)
    ring_idx = 0
    accum_samples = np.array([], dtype=np.int16)
    last_detection_time = 0
    
    while running:
        device_arg, current_device_name = find_audio_device()
        print(f"[INFO] Starte Audio-Aufnahme über {device_arg}...")
        
        cmd = ['arecord', '-D', device_arg, '-f', 'S16_LE', '-r', str(SAMPLE_RATE), '-c', '1', '-t', 'raw', '-q']
        try:
            proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, bufsize=HOP_SAMPLES * 2)
        except Exception as e:
            print(f"[ERR] arecord konnte nicht gestartet werden: {e}")
            update_status("error", current_device_name, current_total_detections, current_last_detection_iso)
            time.sleep(5)
            continue
            
        update_status("listening", current_device_name, current_total_detections, current_last_detection_iso)
        last_heartbeat = time.time()
        last_status_write = 0.0
        
        try:
            bytes_per_chunk = HOP_SAMPLES * 2  # 2 Bytes pro Sample
            while running and proc.poll() is None:
                raw_chunk = proc.stdout.read(bytes_per_chunk)
                if not raw_chunk or len(raw_chunk) < bytes_per_chunk:
                    break
                    
                chunk_int16 = np.frombuffer(raw_chunk, dtype=np.int16)
                
                # Audio-Pegel (RMS, dBFS, Prozent) berechnen
                max_amp = int(np.max(np.abs(chunk_int16))) if len(chunk_int16) > 0 else 0
                rms = float(np.sqrt(np.mean(chunk_int16.astype(np.float64)**2))) if len(chunk_int16) > 0 else 0.0
                dbfs = 20.0 * np.log10(max(1.0, rms) / 32768.0)
                level_pct = max(0, min(100, int((dbfs + 65.0) * (100.0 / 60.0))))
                current_audio_level = {
                    'percent': level_pct,
                    'peak': max_amp,
                    'rms': int(rms),
                    'db': round(dbfs, 1)
                }

                # Status mit Live-Pegel regelmäßig schreiben (ca. alle 400-500ms)
                now_t = time.time()
                if now_t - last_status_write >= 0.45:
                    last_status_write = now_t
                    update_status("listening", current_device_name, current_total_detections, current_last_detection_iso, current_audio_level)
                
                # In Ringpuffer schreiben
                chunk_len = len(chunk_int16)
                end_idx = ring_idx + chunk_len
                if end_idx <= RING_BUFFER_SAMPLES:
                    ring_buffer[ring_idx:end_idx] = chunk_int16
                else:
                    first_part = RING_BUFFER_SAMPLES - ring_idx
                    ring_buffer[ring_idx:] = chunk_int16[:first_part]
                    ring_buffer[:chunk_len - first_part] = chunk_int16[first_part:]
                ring_idx = (ring_idx + chunk_len) % RING_BUFFER_SAMPLES
                
                # Im Inferenz-Akkumulator anhängen
                accum_samples = np.concatenate((accum_samples, chunk_int16))
                
                if time.time() < pause_until:
                    # Aufnahme/Detektion ist während Wiedergabe pausiert (Feedback-Schutz)
                    accum_samples = np.array([], dtype=np.int16)
                    ring_buffer.fill(0)
                    continue

                if len(accum_samples) >= WINDOW_SAMPLES:
                    window = accum_samples[:WINDOW_SAMPLES]
                    accum_samples = accum_samples[HOP_SAMPLES:]  # Hop nach vorne
                    
                    max_amp_window = np.max(np.abs(window))
                    if max_amp_window < 300:  # Sehr leise Geräusche überspringen
                        continue
                        
                    # Float32 Normalisierung [-1.0, 1.0]
                    waveform = (window.astype(np.float32) / 32768.0)
                    
                    interpreter.set_tensor(input_index, waveform)
                    interpreter.invoke()
                    scores = interpreter.get_tensor(output_index)
                    if scores.ndim == 2:
                        scores = scores[0]
                        
                    # Höchste Hundebell-Klasse ermitteln (YAMNet Stufe 1)
                    best_class_idx = -1
                    best_score = 0.0
                    for c_idx in DOG_CLASS_INDICES_YAMNET:
                        s = float(scores[c_idx])
                        if s > best_score:
                            best_score = s
                            best_class_idx = c_idx
                            
                    # Wenn YAMNet anschlägt: Clip sichern und an CNN14 übergeben!
                    if best_score >= SENSITIVITY:
                        now = time.time()
                        if now - last_detection_time >= 1.2:
                            last_detection_time = now
                            now_dt = datetime.now()
                            det_iso = now_dt.isoformat()
                            
                            c_info = DOG_CLASSES_YAMNET.get(best_class_idx, {'name': 'Bellen (Bark)', 'de': 'Hundebellen'})
                            class_name = c_info['name']
                            conf_pct = round(best_score * 100, 1)
                            
                            event_id = int(now * 1000)
                            filename = f"bark_{event_id}.wav"
                            file_rel = f"data/recordings/{filename}"
                            file_abs = os.path.join(RECORDINGS_DIR, filename)
                            
                            ordered_pcm = np.roll(ring_buffer, -ring_idx)
                            save_wav_clip(ordered_pcm, file_abs)
                            
                            event_data = {
                                'id': str(event_id),
                                'timestamp': det_iso,
                                'dateFormatted': now_dt.strftime('%d.%m.%Y'),
                                'timeFormatted': now_dt.strftime('%H:%M:%S'),
                                'className': class_name,
                                'classIdx': best_class_idx,
                                'confidence': round(best_score, 4),
                                'confidencePct': str(conf_pct),
                                'audioUrl': file_rel,
                                'source': 'server_webcam',
                                'status': 'verifying',
                                'yamnet': {
                                    'className': class_name,
                                    'classIdx': best_class_idx,
                                    'confidence': round(best_score, 4),
                                    'confidencePct': str(conf_pct)
                                }
                            }
                            
                            print(f"[YAMNet] 🐕 Vorfilter angeschlagen: {class_name} ({conf_pct}%) -> Übergebe an CNN14 Verifier...")
                            verification_queue.put({
                                'event_data': event_data,
                                'pcm_samples': ordered_pcm.copy(),
                                'wav_path': file_abs
                            })
                            
                if time.time() - last_heartbeat > 10:
                    last_heartbeat = time.time()
                    update_status("listening", current_device_name, current_total_detections, current_last_detection_iso, current_audio_level)
                    
                if time.time() - last_retention_check > 3600:
                    last_retention_check = time.time()
                    cleanup_old_recordings()
                    
        except Exception as e:
            print(f"[ERR] Fehler im Audio-Stream: {e}")
        finally:
            if proc.poll() is None:
                proc.terminate()
                try:
                    proc.wait(timeout=2)
                except Exception:
                    proc.kill()
                    
        if running:
            print("[WARN] Audio-Stream unterbrochen. Warte 3 Sekunden vor Neustart...")
            time.sleep(3)
            
    update_status("stopped", current_device_name, current_total_detections, current_last_detection_iso, current_audio_level)
    print("[INFO] Detektor sauber beendet.")

if __name__ == '__main__':
    main()
