FROM nginx:alpine

# Standardkonfiguration ersetzen
RUN rm -f /etc/nginx/conf.d/default.conf

# Eigene optimierte Nginx-Konfiguration kopieren
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Web-App-Dateien (HTML, JS, CSS, YAMNet Modell, WASM) bereitstellen
COPY public /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
