# Architektur-Regeln (Vertical Slice Architecture) & Tech-Stack

## 1. Architektonische Kernprinzipien (VSA)
- **Slice über Layer:** Strukturiere niemals nach Schichten (Controller/Service). Strukturiere IMMER nach Feature (`src/features/[feature-name]`). Keine Ausnahmen.
- **Shared Nothing:** Jeder Slice ist maximal unabhängig. Geteilte Querschnittslogik (z.B. Auth-Checks, Logging, Fehlerbehandlung) gehört ausschließlich in `src/shared/` und wird von dort importiert – niemals inline dupliziert.
- **CQRS:** Trenne innerhalb eines Slices zwischen Commands (Write) und Queries (Read), sobald beide Seiten unterschiedliche Komplexität aufweisen. Bei einfachen CRUD-Slices ist eine direkte Handler-Funktion ausreichend – erzeuge keinen Boilerplate ohne Mehrwert.

## 2. Optional: Lightweight Mode
Bei einfachen CRUD-Features (<200 LOC, kein geteilter State, keine Business-Regeln):
- Kein CQRS notwendig – ein einzelner Handler reicht
- Feature bleibt im eigenen Slice-Ordner (Struktur bleibt, nur vereinfacht)
- Minimale Testabdeckung: Happy Path genügt

## 3. Technologie-Stack & Asset-Management
- **Sprache:** TypeScript (strict mode, `"strict": true` in `tsconfig.json`)
- **Motor:** Vite + React
- **Design & UI:** Tailwind CSS + shadcn/ui
- **Icons:** Lucide Icons (`lucide-react` via npm)
- **Typografie:** Inter Font (Installation: `npm install @fontsource/inter`, Import in `src/main.tsx`: `import '@fontsource/inter';`)
- **STRIKTE LOCAL-FIRST REGEL (KEIN CDN):** Es werden absolut keine externen CDNs für Skripte, Fonts, Icons oder Stylesheets verwendet. Alle Abhängigkeiten müssen per Paketmanager installiert oder als physische Dateien im Projekt (`public/` oder `src/assets/`) abgelegt und lokal importiert werden. Keine `<link href="https://...">` oder `<script src="https://...">` in der `index.html`.

## 4. Coding-Richtlinien
- **Keine "God Services":** Erstelle NIEMALS Klassen wie `UserService`. Erstelle spezifische Handler (z.B. `RegisterUserHandler`).
- **Validierung & Fehler:** Validiere an der Grenze des Slices. Nutze typisierte Custom Errors – keine generischen Fehler oder `any`.
