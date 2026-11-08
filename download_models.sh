#!/usr/bin/env bash
set -e

# ==============================================================================
# BarkDog Filou - Download-Skript für Machine Learning Modelle
# Lädt das PANNs CNN14 ONNX Modell für Stufe 2 herunter (~312 MB).
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODELS_DIR="$SCRIPT_DIR/models"
MODEL_FILE="$MODELS_DIR/panns_cnn14.onnx"
EXPECTED_SHA256="be2badf3f285866f6b389ac8a27bf705a0f31a11b6f5ffbace51d81b4d4127a9"
DOWNLOAD_URL="https://huggingface.co/minhducjp/webdonhac-models/resolve/main/panns_cnn14.onnx"

mkdir -p "$MODELS_DIR"

echo "=== BarkDog Filou: Modell-Download (PANNs CNN14 ONNX) ==="

check_checksum() {
    local file="$1"
    if command -v sha256sum >/dev/null 2>&1; then
        local sum
        sum=$(sha256sum "$file" | awk '{print $1}')
        if [ "$sum" = "$EXPECTED_SHA256" ]; then
            return 0
        else
            echo "[WARN] Checksumme weicht ab: $sum (erwartet: $EXPECTED_SHA256)"
            return 1
        fi
    fi
    return 0
}

if [ -f "$MODEL_FILE" ]; then
    echo "[INFO] $MODEL_FILE existiert bereits. Prüfe Integrität..."
    if check_checksum "$MODEL_FILE"; then
        echo "[OK] Modell ist vollständig und einsatzbereit."
        exit 0
    else
        echo "[INFO] Vorhandene Datei ungültig. Lade neu herunter..."
    fi
fi

TMP_FILE="${MODEL_FILE}.tmp"
rm -f "$TMP_FILE"

echo "[INFO] Lade panns_cnn14.onnx von Hugging Face herunter (~312 MB)..."
if command -v curl >/dev/null 2>&1; then
    curl -L --progress-bar -o "$TMP_FILE" "$DOWNLOAD_URL"
elif command -v wget >/dev/null 2>&1; then
    wget --progress=bar:force -O "$TMP_FILE" "$DOWNLOAD_URL"
else
    echo "[FEHLER] Weder 'curl' noch 'wget' gefunden. Bitte eines der beiden Tools installieren."
    exit 1
fi

echo "[INFO] Überprüfe Datei-Integrität..."
if check_checksum "$TMP_FILE"; then
    mv "$TMP_FILE" "$MODEL_FILE"
    echo "[ERFOLG] Modell erfolgreich verifiziert und gespeichert unter:"
    echo "         $MODEL_FILE"
else
    echo "[FEHLER] Checksummen-Überprüfung fehlgeschlagen. Datei wurde nicht übernommen."
    rm -f "$TMP_FILE"
    exit 1
fi
