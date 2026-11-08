/**
 * BarkDog Filou - Client Web-UI (YAMNet + CNN14)
 * 2-Stufen KI-Kaskade (YAMNet Vorfilter + CNN14 Verifier)
 * Mit Live-Pegelanzeige, Dual-Klassifizierung, Filtern & 20-Clip-Papierkorb
 * 100% Local-First (Keine CDNs)
 */

(() => {
    // DOM-Elemente Header & Server-Status
    const statusBadge = document.getElementById('statusBadge');
    const statusText = document.getElementById('statusText');
    const serverStatusText = document.getElementById('serverStatusText');
    const serverDeviceName = document.getElementById('serverDeviceName');
    const serverHeartbeat = document.getElementById('serverHeartbeat');
    const infoAudioSource = document.getElementById('infoAudioSource');
    const refreshDataBtn = document.getElementById('refreshDataBtn');

    // DOM-Elemente Live-Pegelanzeige (Level Meter)
    const levelDot = document.getElementById('levelDot');
    const levelBarFill = document.getElementById('levelBarFill');
    const levelPercentText = document.getElementById('levelPercentText');
    const levelDbfsText = document.getElementById('levelDbfsText');
    const levelActivityText = document.getElementById('levelActivityText');
    const levelPeakText = document.getElementById('levelPeakText');

    // DOM-Elemente Test & Log
    const demoAudioBtn = document.getElementById('demoAudioBtn');
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const logTableBody = document.getElementById('logTableBody');
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    const clearLogBtn = document.getElementById('clearLogBtn');
    const statTotalBarks = document.getElementById('statTotalBarks');
    const statLastDetection = document.getElementById('statLastDetection');
    const statTopConfidence = document.getElementById('statTopConfidence');

    // DOM-Elemente Papierkorb
    const openTrashBtn = document.getElementById('openTrashBtn');
    const trashCountBadge = document.getElementById('trashCountBadge');
    const trashModal = document.getElementById('trashModal');
    const modalTrashCount = document.getElementById('modalTrashCount');
    const clearTrashBtn = document.getElementById('clearTrashBtn');
    const closeTrashBtn = document.getElementById('closeTrashBtn');
    const trashTableBody = document.getElementById('trashTableBody');

    // DOM-Elemente Filou KI-Trainer
    const openTrainerBtn = document.getElementById('openTrainerBtn');
    const trainerCountBadge = document.getElementById('trainerCountBadge');
    const trainerModal = document.getElementById('trainerModal');
    const closeTrainerBtn = document.getElementById('closeTrainerBtn');
    const btnTrainerDone = document.getElementById('btnTrainerDone');
    const trainerProgressText = document.getElementById('trainerProgressText');
    const trainerProgressBarFill = document.getElementById('trainerProgressBarFill');
    const trainerStatBarks = document.getElementById('trainerStatBarks');
    const trainerStatNoise = document.getElementById('trainerStatNoise');
    const trainerProfileStatus = document.getElementById('trainerProfileStatus');
    const trainerEmptyState = document.getElementById('trainerEmptyState');
    const trainerCard = document.getElementById('trainerCard');
    const trainerClipTime = document.getElementById('trainerClipTime');
    const trainerClipDate = document.getElementById('trainerClipDate');
    const trainerYamnetScore = document.getElementById('trainerYamnetScore');
    const trainerCnn14Score = document.getElementById('trainerCnn14Score');
    const trainerClipReason = document.getElementById('trainerClipReason');
    const trainerPlayBtn = document.getElementById('trainerPlayBtn');
    const trainerPlayIcon = document.getElementById('trainerPlayIcon');
    const trainerPlayerStatus = document.getElementById('trainerPlayerStatus');
    const trainerAutoPlayCheckbox = document.getElementById('trainerAutoPlayCheckbox');
    const btnVoteNo = document.getElementById('btnVoteNo');
    const btnVoteYes = document.getElementById('btnVoteYes');
    const btnVoteSkip = document.getElementById('btnVoteSkip');
    const trainerLevelPill = document.getElementById('trainerLevelPill');
    const trainerDiscriminationPill = document.getElementById('trainerDiscriminationPill');
    const queueCountAll = document.getElementById('queueCountAll');
    const queueCountTrash = document.getElementById('queueCountTrash');
    const queueCountEvents = document.getElementById('queueCountEvents');
    const trainerClipSourceBadge = document.getElementById('trainerClipSourceBadge');
    const trainerAiPredBadge = document.getElementById('trainerAiPredBadge');
    const trainerAiPredDetail = document.getElementById('trainerAiPredDetail');
    const toggleLearningCurveBtn = document.getElementById('toggleLearningCurveBtn');
    const learningCurveBody = document.getElementById('learningCurveBody');
    const learningLevelSubtitle = document.getElementById('learningLevelSubtitle');
    const levelProgressText = document.getElementById('levelProgressText');
    const levelProgressPct = document.getElementById('levelProgressPct');
    const levelProgressFill = document.getElementById('levelProgressFill');
    const learningHistoryChart = document.getElementById('learningHistoryChart');

    // DOM-Elemente Protokoll-Filter
    const filterTimeRange = document.getElementById('filterTimeRange');
    const filterCustomDay = document.getElementById('filterCustomDay');
    const cnn14Slider = document.getElementById('cnn14Slider');
    const cnn14NumberInput = document.getElementById('cnn14NumberInput');
    const saveCnn14ThresholdBtn = document.getElementById('saveCnn14ThresholdBtn');
    const cnn14SaveNotice = document.getElementById('cnn14SaveNotice');
    const activeChartFilterChip = document.getElementById('activeChartFilterChip');
    const activeChartFilterLabel = document.getElementById('activeChartFilterLabel');
    const resetChartFilterBtn = document.getElementById('resetChartFilterBtn');
    const resetAllFiltersBtn = document.getElementById('resetAllFiltersBtn');
    const filterShownCount = document.getElementById('filterShownCount');
    const filterTotalCount = document.getElementById('filterTotalCount');
    const groupEpisodesCheckbox = document.getElementById('groupEpisodesCheckbox');
    const filterEpisodeStats = document.getElementById('filterEpisodeStats');
    const statTotalEpisodesBadge = document.getElementById('statTotalEpisodesBadge');

    // DOM-Elemente Analyse & Diagramme
    const tabDayBtn = document.getElementById('tabDayBtn');
    const tabWeekBtn = document.getElementById('tabWeekBtn');
    const dayFilterBar = document.getElementById('dayFilterBar');
    const dateSelect = document.getElementById('dateSelect');
    const btnSelectToday = document.getElementById('btnSelectToday');
    const kpiTotalBarks = document.getElementById('kpiTotalBarks');
    const kpiPeakTime = document.getElementById('kpiPeakTime');
    const kpiQuietTime = document.getElementById('kpiQuietTime');
    const kpiMaxConfidence = document.getElementById('kpiMaxConfidence');
    const chartHeading = document.getElementById('chartHeading');
    const chartSubheading = document.getElementById('chartSubheading');
    const chartContainer = document.getElementById('chartContainer');
    const chartScrollWrapper = document.getElementById('chartScrollWrapper');
    const chartMobileScrollHint = document.getElementById('chartMobileScrollHint');
    const chartActiveFilterBanner = document.getElementById('chartActiveFilterBanner');
    const chartActiveFilterText = document.getElementById('chartActiveFilterText');
    const btnJumpToLog = document.getElementById('btnJumpToLog');
    const btnResetChartFilter = document.getElementById('btnResetChartFilter');

    // Mini-Statistiken in der Diagramm-Sektion
    const chartStatTotalLabel = document.getElementById('chartStatTotalLabel');
    const chartStatTotalVal = document.getElementById('chartStatTotalVal');
    const chartStatPeakLabel = document.getElementById('chartStatPeakLabel');
    const chartStatPeakVal = document.getElementById('chartStatPeakVal');
    const chartStatQuietLabel = document.getElementById('chartStatQuietLabel');
    const chartStatQuietVal = document.getElementById('chartStatQuietVal');
    const chartStatConfLabel = document.getElementById('chartStatConfLabel');
    const chartStatConfVal = document.getElementById('chartStatConfVal');

    // Interner State
    let allEvents = [];
    let trashEvents = [];
    let currentAudioPlayer = null;
    let currentlyPlayingEventId = null;
    let highestConfidence = 0;
    let currentView = 'day'; // 'day' | 'week'
    let selectedDateStr = null; // z.B. '2026-11-04'

    // Episoden-State (Zusammenhängende Beller)
    const expandedEpisodeIds = new Set();
    let currentEpisodeSequence = null; // { episodeId, events, currentIndex }

    // Dauerhaft gespeicherter CNN14-Schwellenwert (unabhängig von den Filtern)
    const STORAGE_KEY_CNN14_THRESHOLD = 'barkdog_cnn14_threshold';
    const savedThresholdRaw = localStorage.getItem(STORAGE_KEY_CNN14_THRESHOLD);
    const initialCnn14Threshold = savedThresholdRaw !== null ? parseFloat(savedThresholdRaw) : 0;

    // Dauerhaft gespeicherte Episoden-Gruppierung
    const STORAGE_KEY_GROUP_EPISODES = 'barkdog_group_episodes';
    const savedGroupEpisodes = localStorage.getItem(STORAGE_KEY_GROUP_EPISODES);
    const initialGroupByEpisodes = savedGroupEpisodes !== null ? (savedGroupEpisodes === 'true') : true;

    // Filter-State für das Protokoll (Standard: Aktueller Tag / Heute)
    const filterState = {
        timeRange: 'today',        // Default: 'today' (aktueller Tag)
        customDay: '',           // 'YYYY-MM-DD'
        cnn14Threshold: initialCnn14Threshold, // 0..100 % (dauerhaft gespeichert)
        chartHour: null,         // 0..23 | null
        chartDate: null,         // 'YYYY-MM-DD' | null
        groupByEpisodes: initialGroupByEpisodes, // Beller in kurzem Zeitabstand gruppieren
        groupGapSeconds: 60      // Maximaler Abstand in Sekunden für dieselbe Bell-Serie
    };

    // UI-Elemente initialisieren
    if (filterTimeRange) filterTimeRange.value = 'today';
    if (cnn14Slider) cnn14Slider.value = initialCnn14Threshold;
    if (cnn14NumberInput) cnn14NumberInput.value = initialCnn14Threshold;
    if (groupEpisodesCheckbox) groupEpisodesCheckbox.checked = initialGroupByEpisodes;

    /**
     * Farbverlauf von Rot (0%) über Gelb (50%) bis Grün (100%)
     */
    function getScoreColor(percent) {
        const p = Math.max(0, Math.min(100, Number(percent) || 0));
        const hue = Math.round((p / 100) * 125);
        return `hsl(${hue}, 85%, 45%)`;
    }

    /**
     * Prüft, ob ein Audio-Clip älter als 7 Tage ist (Retention Policy)
     */
    function isAudioExpired(ev) {
        if (ev.audioExpired || !ev.audioUrl) return true;
        if (!ev.timestamp) return false;
        const evTime = new Date(ev.timestamp).getTime();
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        return (Date.now() - evTime) > sevenDaysMs;
    }

    /**
     * 1. Live-Status und Audio-Pegel vom Server abrufen
     */
    async function fetchServerStatus() {
        try {
            const res = await fetch(`data/status.json?t=${Date.now()}`);
            if (!res.ok) return;
            const data = await res.json();

            // Status-Badge mit Unterstützung für Pause während Wiedergabe
            if (data.isPaused || data.status === 'paused') {
                statusBadge.className = 'status-badge paused';
                statusText.textContent = `Aufnahme pausiert (${data.pauseRemaining || 0}s)`;
                serverStatusText.textContent = 'Pausiert (Wiedergabe aktiv – keine Aufzeichnung)';
                serverStatusText.style.color = '#d97706';
            } else if (data.status === 'listening' || data.status === 'running') {
                statusBadge.className = 'status-badge listening';
                statusText.textContent = data.cnn14Active ? 'YAMNet + CNN14 aktiv' : 'Server lauscht 24/7';
                serverStatusText.textContent = data.cnn14Active
                    ? 'Aktiv (2-Stufen-KI: YAMNet Echtzeit + CNN14 Verifier)'
                    : 'Aktiv (Lauscht 24/7 über USB-Mikrofon)';
                serverStatusText.style.color = '#059669';
            } else {
                statusBadge.className = 'status-badge ready';
                statusText.textContent = data.status || 'Bereit';
            }

            if (data.device) {
                serverDeviceName.textContent = data.device;
                infoAudioSource.textContent = data.device;
            }

            if (data.heartbeat) {
                const hb = new Date(data.heartbeat);
                serverHeartbeat.textContent = hb.toLocaleTimeString('de-DE');
            }

            // Live-Pegelanzeige (Level-Meter) aktualisieren
            if (data.audioLevel) {
                updateAudioLevelMeter(data.audioLevel, data.isPaused);
            }
        } catch (e) {
            console.debug('Status-Abruf:', e);
        }
    }

    /**
     * Aktualisiert den Pegelbalken und die Dezibel-Anzeige
     */
    function updateAudioLevelMeter(level, isPaused) {
        if (isPaused) {
            levelBarFill.style.width = '0%';
            levelPercentText.textContent = '0%';
            levelDbfsText.textContent = '– dBFS';
            levelPeakText.textContent = 'Pausiert';
            levelDot.className = 'level-indicator-dot';
            levelActivityText.textContent = 'Wiedergabeschutz aktiv';
            levelActivityText.style.color = '#d97706';
            return;
        }

        const pct = Math.max(0, Math.min(100, Math.round(level.percent || 0)));
        const db = typeof level.db === 'number' ? level.db.toFixed(1) : '-60.0';
        const peak = level.peak || 0;

        levelBarFill.style.width = pct + '%';
        levelPercentText.textContent = pct + '%';
        levelDbfsText.textContent = `${db} dBFS`;
        levelPeakText.textContent = `Peak: ${peak}`;

        // Optische LED- und Text-Zustände
        if (pct >= 75) {
            levelDot.className = 'level-indicator-dot loud';
            levelActivityText.textContent = 'Lautes Geräusch / Bellen!';
            levelActivityText.style.color = '#dc2626';
        } else if (pct >= 25) {
            levelDot.className = 'level-indicator-dot active';
            levelActivityText.textContent = 'Mikrofon aktiv (Ton erkannt)';
            levelActivityText.style.color = '#059669';
        } else {
            levelDot.className = 'level-indicator-dot';
            levelActivityText.textContent = 'Stille / Ruhiger Raum';
            levelActivityText.style.color = 'var(--text-muted)';
        }
    }

    /**
     * 2. Beller-Ereignisse & Papierkorb vom Server abrufen
     */
    async function fetchServerEvents() {
        try {
            const res = await fetch(`data/events.json?t=${Date.now()}`);
            if (res.ok) {
                const serverEvents = await res.json();
                if (Array.isArray(serverEvents)) {
                    const existingIds = new Set(serverEvents.map(e => String(e.id)));
                    const manualEvents = allEvents.filter(e => !existingIds.has(String(e.id)) && e.source === 'demo_test');

                    allEvents = [...manualEvents, ...serverEvents];
                    updateDatesDropdown();
                    updateStatsAndTable();
                    renderAnalyticsChart();
                }
            }
        } catch (e) {
            console.debug('Events-Abruf:', e);
        }

        // Papierkorb-Zähler im Hintergrund synchron halten
        fetchTrash();
    }

    /**
     * Ruft den Papierkorb ab (/api/trash)
     */
    async function fetchTrash() {
        try {
            const res = await fetch(`/api/trash?t=${Date.now()}`);
            if (res.ok) {
                trashEvents = await res.json();
                if (Array.isArray(trashEvents)) {
                    trashCountBadge.textContent = trashEvents.length;
                    modalTrashCount.textContent = trashEvents.length;
                    if (trashModal.style.display !== 'none') {
                        renderTrashTable();
                    }
                }
            }
            fetchTrainerStats();
        } catch (e) {
            console.debug('Trash-Abruf:', e);
        }
    }

    /**
     * Extrahiert eindeutige Datumswerte für die Datums-Dropdowns
     */
    function updateDatesDropdown() {
        const dateSet = new Set();
        const todayStr = getIsoDateString(new Date());
        dateSet.add(todayStr);

        for (const ev of allEvents) {
            if (ev.timestamp) {
                const dStr = getIsoDateString(new Date(ev.timestamp));
                if (dStr) dateSet.add(dStr);
            }
        }

        const sortedDates = Array.from(dateSet).sort().reverse();
        const prevSelected = selectedDateStr;

        // 1. Chart-Dropdown
        dateSelect.innerHTML = '';
        for (const d of sortedDates) {
            const opt = document.createElement('option');
            opt.value = d;
            const formatted = formatDateForDisplay(d);
            opt.textContent = (d === todayStr) ? `${formatted} (Heute)` : formatted;
            dateSelect.appendChild(opt);
        }

        if (filterState.timeRange === 'today') {
            selectedDateStr = todayStr;
            dateSelect.value = todayStr;
        } else if (prevSelected && sortedDates.includes(prevSelected)) {
            dateSelect.value = prevSelected;
            selectedDateStr = prevSelected;
        } else {
            selectedDateStr = sortedDates[0];
            dateSelect.value = selectedDateStr;
        }

        // 2. Tabellenfilter-Dropdown (für filterCustomDay)
        const prevCustom = filterState.customDay || filterCustomDay.value;
        filterCustomDay.innerHTML = '';
        for (const d of sortedDates) {
            const opt = document.createElement('option');
            opt.value = d;
            const formatted = formatDateForDisplay(d);
            opt.textContent = (d === todayStr) ? `${formatted} (Heute)` : formatted;
            filterCustomDay.appendChild(opt);
        }
        if (prevCustom && sortedDates.includes(prevCustom)) {
            filterCustomDay.value = prevCustom;
            filterState.customDay = prevCustom;
        } else {
            filterState.customDay = sortedDates[0];
            filterCustomDay.value = filterState.customDay;
        }
    }

    function getIsoDateString(dateObj) {
        try {
            return dateObj.toISOString().slice(0, 10);
        } catch (e) {
            return null;
        }
    }

    function formatDateForDisplay(isoStr) {
        if (!isoStr) return 'Heute';
        const parts = isoStr.split('-');
        return parts.length === 3 ? `${parts[2]}.${parts[1]}.${parts[0]}` : isoStr;
    }

    /**
     * Filtert allEvents anhand der aktiven Kriterien
     */
    function getFilteredEvents() {
        const todayStr = getIsoDateString(new Date());
        const now = new Date();
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoStr = getIsoDateString(weekAgo);

        return allEvents.filter(ev => {
            if (!ev.timestamp) return false;
            const evDate = new Date(ev.timestamp);
            const evIso = getIsoDateString(evDate);
            const evHour = evDate.getHours();

            // CNN14 Konfidenz für Schwellenwert-Filterung
            const cnn14Conf = getEventCnn14ScorePct(ev);

            // 1. Stufe 2 (CNN14) Schwellenwert-Slider
            if (filterState.cnn14Threshold > 0) {
                if (cnn14Conf < filterState.cnn14Threshold) return false;
            }

            // 2. Diagramm-Filter
            if (filterState.chartHour !== null) {
                if (filterState.chartDate && evIso !== filterState.chartDate) return false;
                if (evHour !== filterState.chartHour) return false;
            } else if (filterState.chartDate !== null) {
                if (evIso !== filterState.chartDate) return false;
            }

            // 3. Zeitraum-Filter
            if (filterState.timeRange === 'today') {
                if (evIso !== todayStr) return false;
            } else if (filterState.timeRange === 'week') {
                if (evIso < weekAgoStr || evIso > todayStr) return false;
            } else if (filterState.timeRange === 'custom_day') {
                if (filterState.customDay && evIso !== filterState.customDay) return false;
            }

            return true;
        });
    }

    /**
     * Ermittelt den CNN14-Konfidenzwert in Prozent (0..100) für ein Ereignis
     */
    function getEventCnn14ScorePct(ev) {
        if (!ev) return 0;
        if (ev.cnn14 && ev.cnn14.confidencePct !== undefined) {
            return parseFloat(ev.cnn14.confidencePct) || 0;
        }
        if (ev.cnn14 && ev.cnn14.confidence !== undefined) {
            return (parseFloat(ev.cnn14.confidence) || 0) * 100.0;
        }
        if (ev.confidencePct !== undefined) {
            return parseFloat(ev.confidencePct) || 0;
        }
        if (ev.confidence !== undefined) {
            return (parseFloat(ev.confidence) || 0) * 100.0;
        }
        return 0;
    }

    /**
     * Aktualisiert die 4 oberen KPI-Statistikkarten strikt nach dem aktiven Filter (Zeitraum & CNN14-Schwelle)
     */
    function updateTopKpiStats() {
        const activeEvents = getFilteredEvents();
        const episodes = groupEventsIntoEpisodes(activeEvents, filterState.groupGapSeconds || 60);

        // 1. Bestätigte Beller im gewählten Zeitraum
        if (statTotalBarks) {
            statTotalBarks.textContent = activeEvents.length;
        }

        // Sub-Badge für Bell-Serien
        if (statTotalEpisodesBadge) {
            if (activeEvents.length > 0 && filterState.groupByEpisodes) {
                const epLabel = episodes.length === 1 ? '1 Serie' : `${episodes.length} Serien`;
                statTotalEpisodesBadge.textContent = epLabel;
                statTotalEpisodesBadge.style.display = 'inline-block';
            } else {
                statTotalEpisodesBadge.style.display = 'none';
            }
        }

        // Export/Clear-Buttons aktivieren/deaktivieren
        if (exportCsvBtn) exportCsvBtn.disabled = (allEvents.length === 0);
        if (clearLogBtn) clearLogBtn.disabled = (allEvents.length === 0);

        // 2. Letzter Beller (im gewählten Zeitraum)
        if (statLastDetection) {
            if (activeEvents.length > 0 && activeEvents[0].timestamp) {
                const latestDt = new Date(activeEvents[0].timestamp);
                statLastDetection.textContent = latestDt.toLocaleTimeString('de-DE');
            } else {
                statLastDetection.textContent = '–';
            }
        }

        // 3. Höchste Konfidenz (im gewählten Zeitraum)
        if (statTopConfidence) {
            if (activeEvents.length > 0) {
                let maxConf = 0;
                for (const ev of activeEvents) {
                    const conf = getEventCnn14ScorePct(ev);
                    if (conf > maxConf) maxConf = conf;
                }
                statTopConfidence.textContent = maxConf.toFixed(1) + '%';
            } else {
                statTopConfidence.textContent = '0%';
            }
        }
    }

    /**
     * Aktualisiert globale Statistiken und stößt Filter-Rendering an
     */
    function updateStatsAndTable() {
        applyFiltersAndRender(false);
    }

    /**
     * Erstellt ein strukturiertes Episoden-Objekt aus einer Liste aufeinanderfolgender Beller
     */
    function createEpisodeObject(eventList) {
        const chronEvents = [...eventList].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        const startTime = new Date(chronEvents[0].timestamp);
        const endTime = new Date(chronEvents[chronEvents.length - 1].timestamp);
        const durationSeconds = Math.max(1, Math.round((endTime - startTime) / 1000));

        const baseId = chronEvents[0].id || String(startTime.getTime());
        const episodeId = `ep_${baseId}`;

        let maxCnn14 = 0;
        let sumCnn14 = 0;
        let maxYamnet = 0;
        let sumYamnet = 0;
        let hasFilou = false;
        let maxFilouPct = 0;

        for (const ev of chronEvents) {
            const cScore = getEventCnn14ScorePct(ev);
            if (cScore > maxCnn14) maxCnn14 = cScore;
            sumCnn14 += cScore;

            const yScore = parseFloat(ev.yamnet?.confidencePct || ev.confidencePct || 0);
            if (yScore > maxYamnet) maxYamnet = yScore;
            sumYamnet += yScore;

            if (ev.cnn14?.filouProfile?.isFilouMatch) {
                hasFilou = true;
                const fPct = ev.cnn14.filouProfile.filouMatchPct || 0;
                if (fPct > maxFilouPct) maxFilouPct = fPct;
            }
        }

        const count = chronEvents.length;

        return {
            id: episodeId,
            isGroup: count > 1,
            count: count,
            events: chronEvents, // chronologisch geordnet (für Delta-Zeiten & Playliste)
            startTime: startTime,
            endTime: endTime,
            durationSeconds: durationSeconds,
            maxCnn14ScorePct: Math.round(maxCnn14 * 10) / 10,
            avgCnn14ScorePct: Math.round((sumCnn14 / count) * 10) / 10,
            maxYamnetScorePct: Math.round(maxYamnet * 10) / 10,
            avgYamnetScorePct: Math.round((sumYamnet / count) * 10) / 10,
            hasFilouMatch: hasFilou,
            maxFilouMatchPct: maxFilouPct
        };
    }

    /**
     * Fasst Beller zusammen, wenn der zeitliche Abstand zwischen ihnen <= maxGapSeconds beträgt
     */
    function groupEventsIntoEpisodes(events, maxGapSeconds = 60) {
        if (!events || events.length === 0) return [];

        // Chronologisch sortieren, um zusammenhängende Sequenzen sauber zu bündeln
        const sorted = [...events].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        const episodes = [];
        let currentGroup = [];

        for (let i = 0; i < sorted.length; i++) {
            const ev = sorted[i];
            if (currentGroup.length === 0) {
                currentGroup.push(ev);
            } else {
                const lastEv = currentGroup[currentGroup.length - 1];
                const diffSec = Math.abs(new Date(ev.timestamp) - new Date(lastEv.timestamp)) / 1000.0;

                if (diffSec <= maxGapSeconds) {
                    currentGroup.push(ev);
                } else {
                    episodes.push(createEpisodeObject(currentGroup));
                    currentGroup = [ev];
                }
            }
        }

        if (currentGroup.length > 0) {
            episodes.push(createEpisodeObject(currentGroup));
        }

        // Neueste Episoden zuerst
        episodes.sort((a, b) => b.endTime - a.endTime);
        return episodes;
    }

    /**
     * Ermittelt die gefilterten Episoden
     */
    function getFilteredEpisodes() {
        const filtered = getFilteredEvents();
        if (!filterState.groupByEpisodes) {
            return filtered.map(ev => createEpisodeObject([ev]));
        }
        return groupEventsIntoEpisodes(filtered, filterState.groupGapSeconds || 60);
    }

    /**
     * Rendert eine Zeile für einen einzelnen isolierten Beller
     */
    function renderSingleEventRow(ev) {
        const dt = new Date(ev.timestamp);
        const timeStr = dt.toLocaleTimeString('de-DE');
        const dateStr = dt.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const isPlayingThis = (currentlyPlayingEventId === String(ev.id));
        const audioExpired = isAudioExpired(ev);

        const yamnet = ev.yamnet || {
            className: ev.className || 'Hund (Dog)',
            confidencePct: ev.confidencePct || '0.0'
        };
        const yamnetConf = parseFloat(yamnet.confidencePct || 0);
        const yamnetColor = getScoreColor(yamnetConf);

        const cnn14 = ev.cnn14 || {
            status: 'confirmed',
            className: ev.className || 'Hundebellen',
            confidencePct: ev.confidencePct || '0.0'
        };
        const cnn14Conf = parseFloat(cnn14.confidencePct || 0);
        const cnn14Color = getScoreColor(cnn14Conf);

        let cnn14BadgeHtml = '';
        if (cnn14.status === 'confirmed') {
            cnn14BadgeHtml = `
                <span class="badge-cnn14-confirmed" title="Von CNN14 geprüft und bestätigt">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Bestätigt
                </span>
            `;
        } else if (cnn14.status === 'manually_confirmed') {
            cnn14BadgeHtml = `<span class="badge-cnn14-manual">Manuell bestätigt</span>`;
        } else if (cnn14.status === 'verifying') {
            cnn14BadgeHtml = `<span class="badge-cnn14-verifying">Prüft...</span>`;
        } else {
            cnn14BadgeHtml = `<span class="badge-cnn14-rejected">${cnn14.className || 'Verworfen'}</span>`;
        }

        let timeBadgeHtml = '';
        const cnn14Dur = cnn14.duration !== undefined ? cnn14.duration : (cnn14.inferenceTimeStr ? parseFloat(cnn14.inferenceTimeStr) : null);
        if (cnn14Dur !== null && !isNaN(cnn14Dur)) {
            timeBadgeHtml = `
                <span class="badge-cnn14-time" title="Klassifizierungszeit durch KI-Modell (CNN14): ${cnn14Dur.toFixed(2)}s">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                    </svg>
                    ${cnn14Dur.toFixed(2)}s
                </span>
            `;
        } else if (cnn14.inferenceTimeStr) {
            timeBadgeHtml = `
                <span class="badge-cnn14-time" title="Klassifizierungszeit durch KI-Modell (CNN14): ${cnn14.inferenceTimeStr}">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                    </svg>
                    ${cnn14.inferenceTimeStr}
                </span>
            `;
        }

        let filouBadgeHtml = '';
        if (cnn14.filouProfile && cnn14.filouProfile.isFilouMatch) {
            const matchPct = cnn14.filouProfile.filouMatchPct || 0;
            filouBadgeHtml = `
                <span class="badge-filou-voice" title="Vom gelernten Stimmprofil als Filou erkannt (${matchPct}% Übereinstimmung)">
                    🎯 Filou (${matchPct}%)
                </span>
            `;
        }

        let audioHtml = '';
        if (audioExpired) {
            audioHtml = `
                <span class="badge-audio-expired" title="Audiodatei nach 7 Tagen planmäßig bereinigt">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    Archiviert
                </span>
            `;
        } else if (ev.audioUrl) {
            audioHtml = `
                <button class="play-clip-btn ${isPlayingThis ? 'playing' : ''}" onclick="window.barkDogPlayAudio('${ev.id}')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        ${isPlayingThis ? '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>' : '<polygon points="5 3 19 12 5 21 5 3"/>'}
                    </svg>
                    ${isPlayingThis ? 'Spielt...' : 'Anhören'}
                </button>
            `;
        } else {
            audioHtml = '<span style="color: var(--text-muted); font-size: 0.8rem;">–</span>';
        }

        return `
            <tr class="event-row" data-event-id="${ev.id}">
                <td class="cell-date" data-label="Datum">
                    <span class="date-text">${dateStr}</span>
                </td>
                <td class="cell-time" data-label="Uhrzeit">
                    <strong class="time-text">${timeStr}</strong>
                </td>
                <td class="cell-yamnet" data-label="Stufe 1 (YAMNet)">
                    <div class="stage-cell-content">
                        <span class="stage-cell-label mobile-only">Stufe 1: YAMNet (Vorfilter)</span>
                        <div class="stage-score-row">
                            <span class="score-pct" style="color: ${yamnetColor};">${yamnetConf}%</span>
                        </div>
                        <div class="confidence-bar">
                            <div class="confidence-fill" style="width: ${yamnetConf}%; background: ${yamnetColor};"></div>
                        </div>
                    </div>
                </td>
                <td class="cell-cnn14" data-label="Stufe 2 (CNN14)">
                    <div class="stage-cell-content">
                        <span class="stage-cell-label mobile-only">Stufe 2: CNN14 Verifier</span>
                        <div class="stage-score-row">
                            <span class="score-pct" style="color: ${cnn14Color};">${cnn14Conf}%</span>
                            <div class="stage-badges">
                                ${timeBadgeHtml}
                                ${cnn14BadgeHtml}
                                ${filouBadgeHtml}
                            </div>
                        </div>
                        <div class="confidence-bar">
                            <div class="confidence-fill" style="width: ${cnn14Conf}%; background: ${cnn14Color};"></div>
                        </div>
                    </div>
                </td>
                <td class="cell-audio" data-label="Audio">
                    ${audioHtml}
                </td>
                <td class="cell-delete" data-label="Löschen">
                    <button class="delete-btn" title="In Papierkorb verschieben" onclick="window.barkDogDeleteEvent('${ev.id}')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </td>
            </tr>
        `;
    }

    /**
     * Rendert die Master-Zeile einer zusammenhängenden Bell-Serie (Episode)
     */
    function renderEpisodeMasterRow(ep) {
        const startDateStr = ep.startTime.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const startTimeStr = ep.startTime.toLocaleTimeString('de-DE');
        const endTimeStr = ep.endTime.toLocaleTimeString('de-DE');
        const durStr = ep.durationSeconds >= 60 
            ? `${Math.floor(ep.durationSeconds / 60)}m ${ep.durationSeconds % 60}s`
            : `${ep.durationSeconds}s`;

        const yamnetColor = getScoreColor(ep.maxYamnetScorePct);
        const cnn14Color = getScoreColor(ep.maxCnn14ScorePct);

        const isPlayingThisEpisode = (currentEpisodeSequence && currentEpisodeSequence.episodeId === ep.id);
        const seqIdx = isPlayingThisEpisode ? currentEpisodeSequence.currentIndex : 0;
        const isExpanded = expandedEpisodeIds.has(ep.id);

        let filouBadgeHtml = '';
        if (ep.hasFilouMatch) {
            filouBadgeHtml = `
                <span class="badge-filou-voice" title="Vom gelernten Stimmprofil als Filou erkannt (${ep.maxFilouMatchPct}% Übereinstimmung)">
                    🎯 Filou (${ep.maxFilouMatchPct}%)
                </span>
            `;
        }

        return `
            <tr class="event-row episode-master-row" data-episode-id="${ep.id}">
                <td class="cell-date" data-label="Datum">
                    <span class="date-text">${startDateStr}</span>
                </td>
                <td class="cell-time" data-label="Zeitraum">
                    <div class="time-range-box">
                        <strong class="time-text">${startTimeStr} – ${endTimeStr}</strong>
                        <div class="episode-meta-badges">
                            <span class="badge-episode-duration" title="Dauer der gesamten Bell-Serie">⏱️ ${durStr}</span>
                            <span class="badge-episode-count" title="${ep.count} Beller in dieser Serie">🐶 ${ep.count} Beller</span>
                        </div>
                    </div>
                </td>
                <td class="cell-yamnet" data-label="Stufe 1 (YAMNet)">
                    <div class="stage-cell-content">
                        <span class="stage-cell-label mobile-only">Stufe 1: YAMNet (Vorfilter)</span>
                        <div class="stage-score-row">
                            <span class="score-pct" style="color: ${yamnetColor}; font-weight: 700;">Max. ${ep.maxYamnetScorePct}%</span>
                            <span class="sub-score-text" style="font-size: 0.75rem; color: var(--text-muted); margin-left: 0.25rem;">(Ø ${ep.avgYamnetScorePct}%)</span>
                        </div>
                        <div class="confidence-bar">
                            <div class="confidence-fill" style="width: ${ep.maxYamnetScorePct}%; background: ${yamnetColor};"></div>
                        </div>
                    </div>
                </td>
                <td class="cell-cnn14" data-label="Stufe 2 (CNN14)">
                    <div class="stage-cell-content">
                        <span class="stage-cell-label mobile-only">Stufe 2: CNN14 Verifier</span>
                        <div class="stage-score-row">
                            <span class="score-pct" style="color: ${cnn14Color}; font-weight: 700;">Max. ${ep.maxCnn14ScorePct}%</span>
                            <span class="sub-score-text" style="font-size: 0.75rem; color: var(--text-muted); margin-left: 0.25rem;">(Ø ${ep.avgCnn14ScorePct}%)</span>
                            <div class="stage-badges">
                                <span class="badge-cnn14-confirmed" title="Serie von CNN14 bestätigt">Bestätigt</span>
                                ${filouBadgeHtml}
                            </div>
                        </div>
                        <div class="confidence-bar">
                            <div class="confidence-fill" style="width: ${ep.maxCnn14ScorePct}%; background: ${cnn14Color};"></div>
                        </div>
                    </div>
                </td>
                <td class="cell-audio" data-label="Audio">
                    <div class="episode-audio-actions">
                        <button class="play-clip-btn play-episode-btn ${isPlayingThisEpisode ? 'playing' : ''}" onclick="window.barkDogPlayEpisode('${ep.id}')" title="Alle ${ep.count} Beller der Serie nacheinander abspielen">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                ${isPlayingThisEpisode ? '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>' : '<polygon points="5 3 19 12 5 21 5 3"/>'}
                            </svg>
                            ${isPlayingThisEpisode ? `Serie (${seqIdx + 1}/${ep.count})...` : `▶ Serie (${ep.count}x)`}
                        </button>
                        <button class="btn-expand-episode ${isExpanded ? 'expanded' : ''}" onclick="window.barkDogToggleEpisode('${ep.id}')" title="${isExpanded ? 'Beller-Details zuklappen' : 'Einzelne Beller anzeigen'}">
                            <span>${isExpanded ? '▲ Zuklappen' : `▼ ${ep.count} Beller`}</span>
                        </button>
                    </div>
                </td>
                <td class="cell-delete" data-label="Löschen">
                    <button class="delete-btn" title="Ganze Serie (${ep.count} Beller) in den Papierkorb verschieben" onclick="window.barkDogDeleteEpisode('${ep.id}')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </td>
            </tr>
        `;
    }

    /**
     * Rendert eine Unterzeile für einen einzelnen Beller innerhalb einer aufgeklappten Bell-Serie
     */
    function renderEpisodeChildRow(childEv, ep, idx, prevEv) {
        const dt = new Date(childEv.timestamp);
        const timeStr = dt.toLocaleTimeString('de-DE');
        const isPlayingThis = (currentlyPlayingEventId === String(childEv.id));
        const audioExpired = isAudioExpired(childEv);

        let deltaHtml = '';
        if (prevEv) {
            const diffSec = Math.max(1, Math.round((dt - new Date(prevEv.timestamp)) / 1000));
            deltaHtml = `<span class="time-delta-text" title="Zeitabstand zum vorherigen Beller">+${diffSec}s</span>`;
        }

        const yamnet = childEv.yamnet || { confidencePct: childEv.confidencePct || '0.0' };
        const yamnetConf = parseFloat(yamnet.confidencePct || 0);
        const yamnetColor = getScoreColor(yamnetConf);

        const cnn14 = childEv.cnn14 || { confidencePct: childEv.confidencePct || '0.0' };
        const cnn14Conf = parseFloat(cnn14.confidencePct || 0);
        const cnn14Color = getScoreColor(cnn14Conf);

        let timeBadgeHtml = '';
        const cnn14Dur = cnn14.duration !== undefined ? cnn14.duration : (cnn14.inferenceTimeStr ? parseFloat(cnn14.inferenceTimeStr) : null);
        if (cnn14Dur !== null && !isNaN(cnn14Dur)) {
            timeBadgeHtml = `<span class="badge-cnn14-time" style="font-size: 0.68rem;" title="CNN14 Zeit: ${cnn14Dur.toFixed(2)}s">⚡ ${cnn14Dur.toFixed(2)}s</span>`;
        }

        let audioHtml = '';
        if (audioExpired) {
            audioHtml = '<span class="badge-audio-expired" style="font-size: 0.74rem;">Archiviert</span>';
        } else if (childEv.audioUrl) {
            audioHtml = `
                <button class="play-clip-btn ${isPlayingThis ? 'playing' : ''}" style="padding: 0.25rem 0.5rem; font-size: 0.78rem;" onclick="window.barkDogPlayAudio('${childEv.id}')">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                        ${isPlayingThis ? '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>' : '<polygon points="5 3 19 12 5 21 5 3"/>'}
                    </svg>
                    ${isPlayingThis ? 'Spielt...' : 'Clip #' + (idx + 1)}
                </button>
            `;
        }

        return `
            <tr class="event-row episode-child-row" data-parent-episode="${ep.id}" data-event-id="${childEv.id}">
                <td class="cell-date" data-label="Position">
                    <span style="font-size: 0.78rem; color: #6366f1; font-weight: 700;">↳ #${idx + 1}</span>
                </td>
                <td class="cell-time" data-label="Uhrzeit">
                    <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 0.2rem;">
                        <span class="time-text" style="font-size: 0.88rem; font-weight: 600;">${timeStr}</span>
                        ${deltaHtml}
                    </div>
                </td>
                <td class="cell-yamnet" data-label="Stufe 1">
                    <div class="stage-cell-content">
                        <span class="stage-cell-label mobile-only">Stufe 1 (Clip #${idx + 1})</span>
                        <div class="stage-score-row">
                            <span class="score-pct" style="color: ${yamnetColor}; font-size: 0.82rem;">${yamnetConf}%</span>
                        </div>
                        <div class="confidence-bar" style="height: 4px;">
                            <div class="confidence-fill" style="width: ${yamnetConf}%; background: ${yamnetColor};"></div>
                        </div>
                    </div>
                </td>
                <td class="cell-cnn14" data-label="Stufe 2">
                    <div class="stage-cell-content">
                        <span class="stage-cell-label mobile-only">Stufe 2 (Clip #${idx + 1})</span>
                        <div class="stage-score-row">
                            <span class="score-pct" style="color: ${cnn14Color}; font-size: 0.82rem;">${cnn14Conf}%</span>
                            <div class="stage-badges">
                                ${timeBadgeHtml}
                            </div>
                        </div>
                        <div class="confidence-bar" style="height: 4px;">
                            <div class="confidence-fill" style="width: ${cnn14Conf}%; background: ${cnn14Color};"></div>
                        </div>
                    </div>
                </td>
                <td class="cell-audio" data-label="Audio">
                    ${audioHtml}
                </td>
                <td class="cell-delete" data-label="Löschen">
                    <button class="delete-btn" style="opacity: 0.7;" title="Nur diesen einzelnen Beller löschen" onclick="window.barkDogDeleteEvent('${childEv.id}')">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </td>
            </tr>
        `;
    }

    /**
     * Rendert die Ereignistabelle basierend auf aktiven Filtern und Gruppierung
     */
    function renderTable() {
        const filtered = getFilteredEvents();
        const threshold = Number(filterState.cnn14Threshold) || 0;
        const matchingEvents = allEvents.filter(ev => getEventCnn14ScorePct(ev) >= threshold);

        filterShownCount.textContent = filtered.length;
        filterTotalCount.textContent = matchingEvents.length;

        if (allEvents.length === 0) {
            logTableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2.5rem 1rem;">
                        Noch keine Hunde-Beller protokolliert. Der Server lauscht 24/7 mit YAMNet & CNN14.
                    </td>
                </tr>
            `;
            return;
        }

        if (filtered.length === 0) {
            logTableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2.5rem 1rem;">
                        <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 0.35rem; font-size: 1rem;">Keine Beller gefunden</div>
                        <div style="font-size: 0.85rem;">Keine Einträge entsprechen deinen aktuellen Filtern (Zeitraum / CNN14-Schwelle / Diagramm).</div>
                        <button onclick="window.barkDogResetAllFilters()" class="btn btn-secondary" style="margin-top: 0.85rem; padding: 0.35rem 0.75rem; font-size: 0.8rem;">
                            Alle Filter aufheben
                        </button>
                    </td>
                </tr>
            `;
            return;
        }

        const episodes = filterState.groupByEpisodes 
            ? groupEventsIntoEpisodes(filtered, filterState.groupGapSeconds || 60)
            : filtered.map(ev => createEpisodeObject([ev]));

        if (filterEpisodeStats) {
            if (filterState.groupByEpisodes && filtered.length > 0) {
                const epText = episodes.length === 1 ? '1 Serie' : `${episodes.length} Serien`;
                filterEpisodeStats.innerHTML = `(in <strong>${episodes.length}</strong> ${episodes.length === 1 ? 'Serie' : 'Serien'})`;
                filterEpisodeStats.style.display = 'inline';
            } else {
                filterEpisodeStats.style.display = 'none';
            }
        }

        let html = '';
        for (const ep of episodes) {
            if (!ep.isGroup) {
                // Einzelevent ohne Bündelung
                html += renderSingleEventRow(ep.events[0]);
            } else {
                // Zusammenhängende Bell-Serie (Master-Zeile)
                html += renderEpisodeMasterRow(ep);

                // Wenn aufgeklappt: Einzel-Beller der Serie anzeigen
                if (expandedEpisodeIds.has(ep.id)) {
                    for (let idx = 0; idx < ep.events.length; idx++) {
                        const childEv = ep.events[idx];
                        const prevEv = idx > 0 ? ep.events[idx - 1] : null;
                        html += renderEpisodeChildRow(childEv, ep, idx, prevEv);
                    }
                }
            }
        }
        logTableBody.innerHTML = html;
    }

    /**
     * Rendert die Tabelle des Papierkorbs (Letzte 20 Clips)
     */
    function renderTrashTable() {
        if (!trashEvents || trashEvents.length === 0) {
            trashTableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 3rem 1rem;">
                        <div style="font-size: 1.1rem; margin-bottom: 0.35rem;">Der Papierkorb ist leer</div>
                        <div style="font-size: 0.85rem;">Hier landen von CNN14 verworfene Fehlalarme oder manuell gelöschte Aufnahmen.</div>
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        for (const item of trashEvents) {
            const dt = new Date(item.timestamp);
            const timeStr = dt.toLocaleTimeString('de-DE');
            const dateStr = dt.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
            const isPlayingThis = (currentlyPlayingEventId === String(item.id));

            const yamnet = item.yamnet || { className: item.className || 'Hund (Dog)', confidencePct: item.confidencePct || '0.0' };
            const cnn14 = item.cnn14 || {};
            const reason = item.reason || (cnn14.topClass ? `Verworfen: ${cnn14.topClass}` : 'Von CNN14 als Fehlalarm verworfen');

            let trashTimeBadge = '';
            const tDur = cnn14.duration !== undefined ? cnn14.duration : (cnn14.inferenceTimeStr ? parseFloat(cnn14.inferenceTimeStr) : null);
            if (tDur !== null && !isNaN(tDur)) {
                trashTimeBadge = `<span class="badge-cnn14-time" style="margin-left: 0.35rem;" title="Inferenzdauer: ${tDur.toFixed(2)}s">⚡ ${tDur.toFixed(2)}s</span>`;
            }

            html += `
                <tr>
                    <td><strong>${timeStr}</strong> <span style="font-size: 0.75rem; color: var(--text-muted);">${dateStr}</span></td>
                    <td>
                        <span class="badge-yamnet">⚡ ${yamnet.className}</span>
                        <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.2rem;">${yamnet.confidencePct}%</div>
                    </td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 0.3rem; flex-wrap: wrap;">
                            <span class="badge-cnn14-rejected" title="${reason}">
                                ❌ ${reason}
                            </span>
                            ${trashTimeBadge}
                        </div>
                        ${cnn14.dogConfidencePct ? `<div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.2rem;">Hundekonfidenz: ${cnn14.dogConfidencePct}%</div>` : ''}
                    </td>
                    <td>
                        ${item.audioUrl ? `
                            <button class="play-clip-btn ${isPlayingThis ? 'playing' : ''}" onclick="window.barkDogPlayAudio('${item.id}', true)">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                    ${isPlayingThis ? '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>' : '<polygon points="5 3 19 12 5 21 5 3"/>'}
                                </svg>
                                ${isPlayingThis ? 'Spielt...' : 'Anhören'}
                            </button>
                        ` : '<span style="color: var(--text-muted); font-size: 0.8rem;">–</span>'}
                    </td>
                    <td style="text-align: center; white-space: nowrap;">
                        <button class="restore-btn" title="Wieder als bestätigten Beller ins Protokoll holen" onclick="window.barkDogRestoreEvent('${item.id}')">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                                <path d="M3 3v5h5"/>
                            </svg>
                            Wiederherstellen
                        </button>
                        <button class="delete-btn" style="margin-left: 0.35rem;" title="Endgültig von Festplatte löschen" onclick="window.barkDogDeleteTrashItem('${item.id}')">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                        </button>
                    </td>
                </tr>
            `;
        }
        trashTableBody.innerHTML = html;
    }

    /**
     * Aus Papierkorb wiederherstellen
     */
    window.barkDogRestoreEvent = async (eventId) => {
        try {
            const res = await fetch(`/api/trash/restore?id=${encodeURIComponent(eventId)}`, { method: 'POST' });
            if (res.ok) {
                await fetchServerEvents();
                await fetchTrash();
            } else {
                alert('Fehler beim Wiederherstellen des Eintrags.');
            }
        } catch (e) {
            console.error('Wiederherstellen fehlgeschlagen:', e);
        }
    };

    /**
     * Einzelnen Clip endgültig aus Papierkorb löschen
     */
    window.barkDogDeleteTrashItem = async (eventId) => {
        if (!confirm('Diesen Clip endgültig von der Festplatte löschen?')) return;
        try {
            const res = await fetch(`/api/trash/delete?id=${encodeURIComponent(eventId)}`, { method: 'POST' });
            if (res.ok) {
                await fetchTrash();
            } else {
                alert('Fehler beim Löschen des Eintrags.');
            }
        } catch (e) {
            console.error('Endgültiges Löschen fehlgeschlagen:', e);
        }
    };

    /**
     * Wendet aktive Filter an, aktualisiert UI-Chips und rendert Tabelle & Diagramm
     */
    function applyFiltersAndRender(scrollUp = false) {
        // 1. Obere KPI-Karten strikt anhand des CNN14-Schwellenwerts aktualisieren
        updateTopKpiStats();

        // 2. Diagramm-Filter-Chip aktualisieren
        if (filterState.chartHour !== null) {
            const hStr = String(filterState.chartHour).padStart(2, '0');
            const dDisplay = formatDateForDisplay(filterState.chartDate);
            activeChartFilterLabel.textContent = `📊 ${dDisplay}, ${hStr}:00–${hStr}:59 Uhr`;
            activeChartFilterChip.style.display = 'inline-flex';
        } else if (filterState.chartDate !== null) {
            const dDisplay = formatDateForDisplay(filterState.chartDate);
            activeChartFilterLabel.textContent = `📊 Tag: ${dDisplay}`;
            activeChartFilterChip.style.display = 'inline-flex';
        } else {
            activeChartFilterChip.style.display = 'none';
        }

        // 2b. Mobiles Diagramm-Banner aktualisieren
        if (chartActiveFilterBanner && chartActiveFilterText) {
            const activeFiltered = getFilteredEvents();
            if (filterState.chartHour !== null) {
                const hStr = String(filterState.chartHour).padStart(2, '0');
                const dDisplay = formatDateForDisplay(filterState.chartDate);
                chartActiveFilterText.innerHTML = `Filter: <strong>${dDisplay}, ${hStr}:00–${hStr}:59 Uhr</strong> (${activeFiltered.length} Beller)`;
                chartActiveFilterBanner.style.display = 'flex';
            } else if (filterState.chartDate !== null) {
                const dDisplay = formatDateForDisplay(filterState.chartDate);
                chartActiveFilterText.innerHTML = `Filter: <strong>Tag: ${dDisplay}</strong> (${activeFiltered.length} Beller)`;
                chartActiveFilterBanner.style.display = 'flex';
            } else {
                chartActiveFilterBanner.style.display = 'none';
            }
        }

        // 3. "Alle Filter aufheben"-Button anzeigen wenn vom Standard (Heute) abgewichen wird
        const hasActiveFilters = (
            filterState.timeRange !== 'today' ||
            filterState.chartHour !== null ||
            filterState.chartDate !== null
        );
        resetAllFiltersBtn.style.display = hasActiveFilters ? 'inline-block' : 'none';

        // 4. Tabelle neu rendern
        renderTable();

        // 5. Diagramm neu rendern (für aktive Balken-Hervorhebung)
        renderAnalyticsChart();

        // 6. Bei Diagramm-Klick: Auf Desktop sanft hochscrollen, auf Mobile am Diagramm bleiben (mit Banner-Sprungmarke)
        if (scrollUp) {
            const isMobile = window.innerWidth <= 768;
            if (!isMobile) {
                const logEl = document.querySelector('.log-section');
                if (logEl) {
                    logEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        }
    }

    /**
     * Zu Protokoll hochspringen (z.B. vom mobilen Diagramm-Banner)
     */
    window.barkDogJumpToLog = () => {
        const logEl = document.querySelector('.log-section');
        if (logEl) {
            logEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    /**
     * Nur den Diagramm-Balken-Filter aufheben
     */
    window.barkDogResetChartFilter = () => {
        filterState.chartHour = null;
        filterState.chartDate = null;
        applyFiltersAndRender(false);
    };

    if (btnJumpToLog) btnJumpToLog.addEventListener('click', window.barkDogJumpToLog);
    if (btnResetChartFilter) btnResetChartFilter.addEventListener('click', window.barkDogResetChartFilter);

    /**
     * Diagramm-Balken Klick: Stunde filtern
     */
    window.barkDogFilterHour = (h) => {
        if (filterState.chartHour === h && filterState.chartDate === selectedDateStr) {
            filterState.chartHour = null;
            filterState.chartDate = null;
            applyFiltersAndRender(false);
        } else {
            filterState.chartHour = h;
            filterState.chartDate = selectedDateStr;
            applyFiltersAndRender(true);
        }
    };

    /**
     * Diagramm-Balken Klick: Tag filtern (Wochenansicht)
     */
    window.barkDogFilterDay = (isoDate) => {
        if (filterState.chartDate === isoDate && filterState.chartHour === null) {
            filterState.chartDate = null;
            applyFiltersAndRender(false);
        } else {
            filterState.chartDate = isoDate;
            filterState.chartHour = null;
            applyFiltersAndRender(true);
        }
    };

    /**
     * Alle temporären Filter zurücksetzen (setzt sauber auf Standard "Heute" zurück, CNN14-Schwellenwert bleibt erhalten!)
     */
    window.barkDogResetAllFilters = () => {
        filterState.timeRange = 'today';
        filterState.customDay = '';
        // filterState.cnn14Threshold bleibt bewusst erhalten!
        filterState.chartHour = null;
        filterState.chartDate = null;

        filterTimeRange.value = 'today';
        filterCustomDay.style.display = 'none';

        const todayStr = getIsoDateString(new Date());
        selectedDateStr = todayStr;
        dateSelect.value = todayStr;
        currentView = 'day';
        tabDayBtn.classList.add('active');
        tabWeekBtn.classList.remove('active');
        dayFilterBar.style.display = 'flex';

        applyFiltersAndRender(false);
    };

    /**
     * 3. Diagramm-Auswertung: Tagesverlauf (24 Stunden) oder Wochenansicht (7 Tage)
     */
    function renderAnalyticsChart() {
        if (currentView === 'day') {
            renderDayTimelineChart();
        } else {
            renderWeekOverviewChart();
        }
    }

    /**
     * Tagesverlauf: 24-Stunden-Diagramm (00:00 - 23:59 Uhr)
     */
    function renderDayTimelineChart() {
        chartHeading.textContent = `Tagesverlauf der Beller (${formatDateForDisplay(selectedDateStr)})`;
        chartSubheading.textContent = 'Uhrzeiten (00:00 – 23:59 Uhr)';

        if (chartScrollWrapper) {
            chartScrollWrapper.className = 'chart-scroll-wrapper day-mode';
        }
        if (chartMobileScrollHint) {
            chartMobileScrollHint.style.display = 'inline-flex';
        }

        // Labels für die Mini-Statistiken in der Sektion
        if (chartStatTotalLabel) chartStatTotalLabel.textContent = 'Beller am Tag';
        if (chartStatPeakLabel) chartStatPeakLabel.textContent = 'Aktivste Stunde';
        if (chartStatQuietLabel) chartStatQuietLabel.textContent = 'Ruhigste Phase';
        if (chartStatConfLabel) chartStatConfLabel.textContent = 'Höchste Konfidenz';

        const hourlyBuckets = new Array(24).fill(0);
        let dayTotal = 0;
        let dayMaxConf = 0;

        for (const ev of allEvents) {
            if (!ev.timestamp) continue;

            // Stufe 2 (CNN14) Schwellenwert-Slider auch im Diagramm anwenden
            const cnn14Conf = getEventCnn14ScorePct(ev);
            if (filterState.cnn14Threshold > 0 && cnn14Conf < filterState.cnn14Threshold) continue;

            const evDate = new Date(ev.timestamp);
            const evDateStr = getIsoDateString(evDate);

            if (evDateStr === selectedDateStr) {
                const hour = evDate.getHours();
                hourlyBuckets[hour]++;
                dayTotal++;
                const conf = ev.cnn14?.confidence ? parseFloat(ev.cnn14.confidence) : parseFloat(ev.confidence || 0);
                if (conf > dayMaxConf) dayMaxConf = conf;
            }
        }

        const maxConfStr = dayMaxConf > 0 ? (dayMaxConf * 100).toFixed(1) + '%' : '0%';
        kpiTotalBarks.textContent = dayTotal;
        if (chartStatTotalVal) chartStatTotalVal.textContent = dayTotal;
        kpiMaxConfidence.textContent = maxConfStr;
        if (chartStatConfVal) chartStatConfVal.textContent = maxConfStr;

        let peakHour = -1;
        let peakHourCount = 0;
        for (let h = 0; h < 24; h++) {
            if (hourlyBuckets[h] > peakHourCount) {
                peakHourCount = hourlyBuckets[h];
                peakHour = h;
            }
        }

        const peakStr = (peakHour >= 0 && peakHourCount > 0)
            ? `${String(peakHour).padStart(2, '0')}:00 – ${String(peakHour).padStart(2, '0')}:59 Uhr (${peakHourCount}x)`
            : 'Keine Beller';
        kpiPeakTime.textContent = peakStr;
        if (chartStatPeakVal) chartStatPeakVal.textContent = peakStr;

        const phases = [
            { name: 'Nacht (00–06h)', count: hourlyBuckets.slice(0, 6).reduce((a, b) => a + b, 0) },
            { name: 'Morgen (06–12h)', count: hourlyBuckets.slice(6, 12).reduce((a, b) => a + b, 0) },
            { name: 'Nachmittag (12–18h)', count: hourlyBuckets.slice(12, 18).reduce((a, b) => a + b, 0) },
            { name: 'Abend (18–24h)', count: hourlyBuckets.slice(18, 24).reduce((a, b) => a + b, 0) }
        ];
        phases.sort((a, b) => a.count - b.count);
        const quietStr = `${phases[0].name}: ${phases[0].count} Beller`;
        kpiQuietTime.textContent = quietStr;
        if (chartStatQuietVal) chartStatQuietVal.textContent = quietStr;

        const maxVal = Math.max(4, Math.max(...hourlyBuckets));
        const svgW = 760;
        const svgH = 200;
        const padL = 35;
        const padR = 15;
        const padT = 25;
        const padB = 30;
        const chartW = svgW - padL - padR;
        const chartH = svgH - padT - padB;
        const colW = chartW / 24;
        const barW = colW - 5;

        let svgHtml = `<svg class="svg-chart day-chart" viewBox="0 0 ${svgW} ${svgH}">`;

        for (let i = 0; i <= 4; i++) {
            const yVal = Math.round((maxVal / 4) * i);
            const yPos = padT + chartH - (i / 4) * chartH;
            svgHtml += `
                <line x1="${padL}" y1="${yPos}" x2="${svgW - padR}" y2="${yPos}" stroke="#e2e8f0" stroke-dasharray="3,3" stroke-width="1"/>
                <text x="${padL - 8}" y="${yPos + 4}" fill="#64748b" font-size="10" font-weight="500" text-anchor="end">${yVal}</text>
            `;
        }

        for (let h = 0; h < 24; h++) {
            const count = hourlyBuckets[h];
            const barH = count > 0 ? Math.max(6, (count / maxVal) * chartH) : 3;
            const x = padL + (h * colW) + 2.5;
            const y = padT + chartH - barH;

            let fill = '#f1f5f9';
            if (count >= 5) fill = '#ef4444';
            else if (count >= 3) fill = '#f59e0b';
            else if (count >= 1) fill = '#3b82f6';

            const isFiltered = (filterState.chartHour === h && filterState.chartDate === selectedDateStr);
            const activeClass = isFiltered ? 'active-bar' : '';

            svgHtml += `
                <g class="bar-group" onclick="window.barkDogFilterHour(${h})" role="button" tabindex="0" style="outline: none;">
                    <rect class="bar-touch-target" x="${padL + (h * colW)}" y="0" width="${colW}" height="${svgH}" fill="transparent" />
                    <rect class="bar-rect ${activeClass}" x="${x}" y="${y}" width="${barW}" height="${barH}" rx="3" fill="${fill}">
                        <title>${h}:00 - ${h}:59 Uhr: ${count} Beller (Klicken zum Filtern des Protokolls)</title>
                    </rect>
                    ${count > 0 ? `<text x="${x + barW / 2}" y="${y - 6}" fill="#0f172a" font-size="11" font-weight="700" text-anchor="middle">${count}</text>` : ''}
                    <text x="${x + barW / 2}" y="${svgH - 10}" fill="${h % 2 === 0 ? '#475569' : '#94a3b8'}" font-size="10" font-weight="${h % 2 === 0 ? '600' : '400'}" text-anchor="middle">${String(h).padStart(2, '0')}h</text>
                </g>
            `;
        }

        svgHtml += `</svg>`;
        chartContainer.innerHTML = svgHtml;

        // Auf Mobilgeräten sanft zur aktuellen oder Spitzenstunde scrollen
        if (window.innerWidth <= 768 && chartScrollWrapper) {
            setTimeout(() => {
                const targetHour = filterState.chartHour !== null 
                    ? filterState.chartHour 
                    : (peakHour >= 0 && peakHourCount > 0 ? peakHour : new Date().getHours());
                const barCenter = padL + (targetHour * colW) + (colW / 2);
                const renderedW = chartContainer.scrollWidth || 640;
                const scale = renderedW / svgW;
                const scrollX = Math.max(0, (barCenter * scale) - (chartScrollWrapper.clientWidth / 2));
                chartScrollWrapper.scrollTo({ left: scrollX, behavior: 'smooth' });
            }, 60);
        }
    }

    /**
     * Wochenansicht: 7-Tage-Diagramm
     */
    function renderWeekOverviewChart() {
        chartHeading.textContent = 'Wochenübersicht (Letzte 7 Tage)';
        chartSubheading.textContent = 'Beller pro Wochentag';

        if (chartScrollWrapper) {
            chartScrollWrapper.className = 'chart-scroll-wrapper week-mode';
        }
        if (chartMobileScrollHint) {
            chartMobileScrollHint.style.display = 'none';
        }

        // Labels für die Mini-Statistiken in der Sektion
        if (chartStatTotalLabel) chartStatTotalLabel.textContent = 'Beller (7 Tage)';
        if (chartStatPeakLabel) chartStatPeakLabel.textContent = 'Spitzentag';
        if (chartStatQuietLabel) chartStatQuietLabel.textContent = 'Ø Beller / Tag';
        if (chartStatConfLabel) chartStatConfLabel.textContent = 'Höchste Konfidenz';

        const days = [];
        const dayCounts = {};
        const now = new Date();

        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const iso = getIsoDateString(d);
            days.push({
                iso: iso,
                label: d.toLocaleDateString('de-DE', { weekday: 'short' }),
                display: d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
            });
            dayCounts[iso] = 0;
        }

        let weekTotal = 0;
        let weekMaxConf = 0;

        for (const ev of allEvents) {
            if (!ev.timestamp) continue;

            // Stufe 2 (CNN14) Schwellenwert-Slider auch in Wochenübersicht anwenden
            const cnn14Conf = getEventCnn14ScorePct(ev);
            if (filterState.cnn14Threshold > 0 && cnn14Conf < filterState.cnn14Threshold) continue;

            const evIso = getIsoDateString(new Date(ev.timestamp));
            if (dayCounts.hasOwnProperty(evIso)) {
                dayCounts[evIso]++;
                weekTotal++;
                const conf = ev.cnn14?.confidence ? parseFloat(ev.cnn14.confidence) : parseFloat(ev.confidence || 0);
                if (conf > weekMaxConf) weekMaxConf = conf;
            }
        }

        const maxConfStr = weekMaxConf > 0 ? (weekMaxConf * 100).toFixed(1) + '%' : '0%';
        kpiTotalBarks.textContent = weekTotal;
        if (chartStatTotalVal) chartStatTotalVal.textContent = weekTotal;
        kpiMaxConfidence.textContent = maxConfStr;
        if (chartStatConfVal) chartStatConfVal.textContent = maxConfStr;

        let peakDayName = '–';
        let peakDayCount = 0;
        for (const day of days) {
            const c = dayCounts[day.iso] || 0;
            if (c > peakDayCount) {
                peakDayCount = c;
                peakDayName = `${day.label}, ${day.display} (${c}x)`;
            }
        }
        const peakStr = peakDayCount > 0 ? peakDayName : 'Keine Beller';
        kpiPeakTime.textContent = peakStr;
        if (chartStatPeakVal) chartStatPeakVal.textContent = peakStr;

        const avgBarks = (weekTotal / 7).toFixed(1);
        const avgStr = `Ø ${avgBarks} Beller / Tag`;
        kpiQuietTime.textContent = avgStr;
        if (chartStatQuietVal) chartStatQuietVal.textContent = avgStr;

        const counts = days.map(d => dayCounts[d.iso]);
        const maxVal = Math.max(5, Math.max(...counts));
        const svgW = 760;
        const svgH = 200;
        const padL = 35;
        const padR = 25;
        const padT = 25;
        const padB = 30;
        const chartW = svgW - padL - padR;
        const chartH = svgH - padT - padB;
        const colW = chartW / 7;
        const barW = colW - 20;

        let svgHtml = `<svg class="svg-chart week-chart" viewBox="0 0 ${svgW} ${svgH}">`;

        for (let i = 0; i <= 4; i++) {
            const yVal = Math.round((maxVal / 4) * i);
            const yPos = padT + chartH - (i / 4) * chartH;
            svgHtml += `
                <line x1="${padL}" y1="${yPos}" x2="${svgW - padR}" y2="${yPos}" stroke="#e2e8f0" stroke-dasharray="3,3" stroke-width="1"/>
                <text x="${padL - 8}" y="${yPos + 4}" fill="#64748b" font-size="10" font-weight="500" text-anchor="end">${yVal}</text>
            `;
        }

        for (let i = 0; i < 7; i++) {
            const d = days[i];
            const count = dayCounts[d.iso];
            const barH = count > 0 ? Math.max(8, (count / maxVal) * chartH) : 4;
            const x = padL + (i * colW) + 10;
            const y = padT + chartH - barH;

            let fill = count > 0 ? '#3b82f6' : '#f1f5f9';
            if (count >= 10) fill = '#ef4444';
            else if (count >= 5) fill = '#f59e0b';

            const isFiltered = (filterState.chartDate === d.iso && filterState.chartHour === null);
            const activeClass = isFiltered ? 'active-bar' : '';

            svgHtml += `
                <g class="bar-group" onclick="window.barkDogFilterDay('${d.iso}')" role="button" tabindex="0" style="outline: none;">
                    <rect class="bar-touch-target" x="${padL + (i * colW)}" y="0" width="${colW}" height="${svgH}" fill="transparent" />
                    <rect class="bar-rect ${activeClass}" x="${x}" y="${y}" width="${barW}" height="${barH}" rx="5" fill="${fill}">
                        <title>${d.label} ${d.display}: ${count} Beller (Klicken zum Filtern des Protokolls)</title>
                    </rect>
                    ${count > 0 ? `<text x="${x + barW / 2}" y="${y - 6}" fill="#0f172a" font-size="13" font-weight="700" text-anchor="middle">${count}</text>` : ''}
                    <text x="${x + barW / 2}" y="${svgH - 12}" fill="#0f172a" font-weight="700" font-size="12" text-anchor="middle">${d.label}</text>
                    <text x="${x + barW / 2}" y="${svgH}" fill="#64748b" font-size="10" font-weight="500" text-anchor="middle">${d.display}</text>
                </g>
            `;
        }

        svgHtml += `</svg>`;
        chartContainer.innerHTML = svgHtml;
    }

    /**
     * Aufklappen / Zuklappen einer Bell-Serie im Protokoll
     */
    window.barkDogToggleEpisode = (episodeId) => {
        if (expandedEpisodeIds.has(episodeId)) {
            expandedEpisodeIds.delete(episodeId);
        } else {
            expandedEpisodeIds.add(episodeId);
        }
        renderTable();
    };

    /**
     * Serie nacheinander als Playlist abspielen
     */
    window.barkDogPlayEpisode = async (episodeId) => {
        if (currentEpisodeSequence && currentEpisodeSequence.episodeId === episodeId) {
            if (currentAudioPlayer) {
                currentAudioPlayer.pause();
                currentAudioPlayer = null;
            }
            currentEpisodeSequence = null;
            currentlyPlayingEventId = null;
            try {
                await fetch('/api/resume', { method: 'POST' });
            } catch (e) {}
            renderTable();
            fetchServerStatus();
            return;
        }

        const episodes = getFilteredEpisodes();
        const ep = episodes.find(e => e.id === episodeId);
        if (!ep || !ep.events || ep.events.length === 0) return;

        const playableEvents = ep.events.filter(ev => ev.audioUrl && !isAudioExpired(ev));
        if (playableEvents.length === 0) {
            alert('Keine Audiodateien für diese Serie mehr verfügbar (bereits nach 7 Tagen bereinigt).');
            return;
        }

        if (currentAudioPlayer) {
            currentAudioPlayer.pause();
            currentAudioPlayer = null;
            currentlyPlayingEventId = null;
        }

        currentEpisodeSequence = {
            episodeId: episodeId,
            events: playableEvents,
            currentIndex: 0
        };

        playNextEpisodeClip();
    };

    async function playNextEpisodeClip() {
        if (!currentEpisodeSequence) return;
        const { episodeId, events, currentIndex } = currentEpisodeSequence;

        if (currentIndex >= events.length) {
            currentEpisodeSequence = null;
            currentlyPlayingEventId = null;
            try {
                await fetch('/api/resume', { method: 'POST' });
            } catch (e) {}
            renderTable();
            fetchServerStatus();
            return;
        }

        const currentEv = events[currentIndex];
        currentlyPlayingEventId = String(currentEv.id);
        renderTable();
        fetchServerStatus();

        try {
            await fetch('/api/pause?duration=30', { method: 'POST' });
            const audio = new Audio(`${currentEv.audioUrl}?t=${Date.now()}`);
            currentAudioPlayer = audio;

            audio.onended = () => {
                if (!currentEpisodeSequence || currentEpisodeSequence.episodeId !== episodeId) return;
                currentEpisodeSequence.currentIndex++;
                playNextEpisodeClip();
            };

            audio.onerror = () => {
                console.warn('Clip konnte in Serie nicht geladen werden:', currentEv.id);
                if (!currentEpisodeSequence || currentEpisodeSequence.episodeId !== episodeId) return;
                currentEpisodeSequence.currentIndex++;
                playNextEpisodeClip();
            };

            await audio.play();
        } catch (e) {
            console.warn('Wiedergabefehler in Serie:', e);
            if (currentEpisodeSequence && currentEpisodeSequence.episodeId === episodeId) {
                currentEpisodeSequence.currentIndex++;
                playNextEpisodeClip();
            }
        }
    }

    /**
     * Ganze Bell-Serie in den Papierkorb verschieben
     */
    window.barkDogDeleteEpisode = async (episodeId) => {
        const episodes = getFilteredEpisodes();
        const ep = episodes.find(e => e.id === episodeId);
        if (!ep) return;

        if (!confirm(`Möchtest du diese gesamte Bell-Serie mit ${ep.count} Bellern in den Papierkorb verschieben?`)) {
            return;
        }

        if (currentEpisodeSequence && currentEpisodeSequence.episodeId === episodeId) {
            if (currentAudioPlayer) currentAudioPlayer.pause();
            currentAudioPlayer = null;
            currentEpisodeSequence = null;
            currentlyPlayingEventId = null;
            try { await fetch('/api/resume', { method: 'POST' }); } catch (e) {}
        }

        try {
            for (const ev of ep.events) {
                await fetch(`/api/delete?id=${encodeURIComponent(ev.id)}`, { method: 'POST' });
                allEvents = allEvents.filter(e => String(e.id) !== String(ev.id));
            }
            updateStatsAndTable();
            updateDatesDropdown();
            renderAnalyticsChart();
            fetchTrash();
        } catch (e) {
            console.error('Fehler beim Löschen der Serie:', e);
        }
    };

    /**
     * Globales Abspielen eines Audio-Clips mit Server-Aufnahmestopp
     */
    window.barkDogPlayAudio = async (eventId, fromTrash = false) => {
        const pool = fromTrash ? trashEvents : allEvents;
        const ev = pool.find(e => String(e.id) === String(eventId));
        if (!ev) return;

        // Falls eine Serie lief, stoppen
        if (currentEpisodeSequence) {
            currentEpisodeSequence = null;
        }

        if (currentAudioPlayer) {
            currentAudioPlayer.pause();
            currentAudioPlayer = null;
            currentlyPlayingEventId = null;
            try {
                await fetch('/api/resume', { method: 'POST' });
            } catch (e) {}
        }

        let audioSrc = null;
        if (ev.audioUrl) {
            audioSrc = ev.audioUrl;
        } else if (ev.audioBlob) {
            audioSrc = URL.createObjectURL(ev.audioBlob);
        }

        if (audioSrc) {
            try {
                await fetch('/api/pause?duration=6', { method: 'POST' });
            } catch (e) {}

            currentlyPlayingEventId = String(eventId);
            if (fromTrash) renderTrashTable();
            else renderTable();
            fetchServerStatus();

            const audio = new Audio(audioSrc);
            currentAudioPlayer = audio;

            const finishPlayback = async () => {
                currentAudioPlayer = null;
                currentlyPlayingEventId = null;
                try {
                    await fetch('/api/resume', { method: 'POST' });
                } catch (e) {}
                if (fromTrash) renderTrashTable();
                else renderTable();
                fetchServerStatus();
            };

            audio.onended = finishPlayback;
            audio.onpause = finishPlayback;
            audio.onerror = finishPlayback;

            audio.play().catch(finishPlayback);
        }
    };

    /**
     * Demo-Audio testen (sample-bark.wav)
     */
    async function testDemoAudio() {
        try {
            demoAudioBtn.disabled = true;
            demoAudioBtn.textContent = 'Spiele Demo-Bellen ab (Aufnahme pausiert)...';

            try {
                await fetch('/api/pause?duration=5', { method: 'POST' });
            } catch (e) {}
            fetchServerStatus();

            const audio = new Audio('sample-bark.wav');

            const endDemo = async () => {
                try {
                    await fetch('/api/resume', { method: 'POST' });
                } catch (e) {}
                demoAudioBtn.disabled = false;
                demoAudioBtn.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polygon points="10 8 16 12 10 16 10 8"/>
                    </svg>
                    Demo-Bellen testen (sample-bark.wav)
                `;
                fetchServerStatus();
            };

            audio.onended = endDemo;
            audio.onerror = endDemo;
            audio.play().catch(endDemo);

            setTimeout(() => {
                const now = new Date();
                const demoEvent = {
                    id: String(Date.now()),
                    timestamp: now.toISOString(),
                    dateFormatted: now.toLocaleDateString('de-DE'),
                    timeFormatted: now.toLocaleTimeString('de-DE'),
                    className: 'Bellen (Bark)',
                    classIdx: 70,
                    confidence: 0.88,
                    confidencePct: '88.0',
                    audioUrl: 'sample-bark.wav',
                    source: 'demo_test',
                    status: 'confirmed',
                    yamnet: {
                        className: 'Bellen (Bark)',
                        classIdx: 70,
                        confidence: 0.88,
                        confidencePct: '88.0'
                    },
                    cnn14: {
                        status: 'confirmed',
                        className: 'Bark (Hundebellen)',
                        classIdx: 75,
                        confidence: 0.94,
                        confidencePct: '94.0',
                        topClass: 'Bark (94.0%)'
                    }
                };
                allEvents.unshift(demoEvent);
                updateStatsAndTable();
                updateDatesDropdown();
                renderAnalyticsChart();
            }, 800);
        } catch (e) {
            console.error('Demo-Fehler:', e);
            demoAudioBtn.disabled = false;
        }
    }

    /**
     * CSV Export (exportiert gefilterte Ansicht inkl. Bell-Serien-Zuordnung)
     */
    function exportCsv() {
        const eventsToExport = getFilteredEvents();
        if (eventsToExport.length === 0) {
            alert('Keine Beller im aktuellen Filter vorhanden.');
            return;
        }

        // Episoden ermitteln für Serie-Spalte
        const episodes = groupEventsIntoEpisodes(eventsToExport, filterState.groupGapSeconds || 60);
        const eventEpisodeMap = new Map();
        for (let epIdx = 0; epIdx < episodes.length; epIdx++) {
            const ep = episodes[epIdx];
            for (let cIdx = 0; cIdx < ep.events.length; cIdx++) {
                const ev = ep.events[cIdx];
                eventEpisodeMap.set(String(ev.id), {
                    epNum: episodes.length - epIdx,
                    epTotal: ep.count,
                    clipNum: cIdx + 1
                });
            }
        }

        let csv = 'ID,Datum,Uhrzeit,Serie_Nr,Serie_Beller_Anzahl,Clip_In_Serie,YAMNet_Klasse,YAMNet_Score,CNN14_Status,CNN14_Klasse,CNN14_Score,Quelle\n';
        for (const ev of eventsToExport) {
            const dt = new Date(ev.timestamp);
            const dateStr = dt.toISOString().split('T')[0];
            const timeStr = dt.toTimeString().split(' ')[0];
            const yName = ev.yamnet?.className || ev.className || '';
            const yScore = ev.yamnet?.confidencePct || ev.confidencePct || '';
            const cStatus = ev.cnn14?.status || 'confirmed';
            const cName = ev.cnn14?.className || ev.className || '';
            const cScore = ev.cnn14?.confidencePct || ev.confidencePct || '';

            const epInfo = eventEpisodeMap.get(String(ev.id)) || { epNum: 1, epTotal: 1, clipNum: 1 };

            csv += `"${ev.id}","${dateStr}","${timeStr}","Serie ${epInfo.epNum}",${epInfo.epTotal},${epInfo.clipNum},"${yName}",${yScore},"${cStatus}","${cName}",${cScore},"${ev.source || 'server'}"\n`;
        }

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `barkdog_filou_protokoll_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Einzelnes Ereignis in den Papierkorb verschieben
     */
    window.barkDogDeleteEvent = async (eventId) => {
        if (!confirm('Diesen Eintrag in den Papierkorb verschieben?')) return;
        try {
            const res = await fetch(`/api/delete?id=${encodeURIComponent(eventId)}`, { method: 'POST' });
            if (res.ok) {
                allEvents = allEvents.filter(e => String(e.id) !== String(eventId));
                updateStatsAndTable();
                updateDatesDropdown();
                renderAnalyticsChart();
                fetchTrash();
            } else {
                alert('Fehler beim Verschieben in den Papierkorb.');
            }
        } catch (err) {
            console.error('Löschen fehlgeschlagen:', err);
            allEvents = allEvents.filter(e => String(e.id) !== String(eventId));
            updateStatsAndTable();
            renderAnalyticsChart();
        }
    };

    /**
     * Log leeren
     */
    async function clearLog() {
        if (!confirm('Möchtest du das gesamte Beller-Protokoll leeren?')) return;
        try {
            const res = await fetch('/api/clear', { method: 'POST' });
            if (res.ok) {
                allEvents = [];
                highestConfidence = 0;
                statTotalBarks.textContent = '0';
                statLastDetection.textContent = '–';
                statTopConfidence.textContent = '0%';
                exportCsvBtn.disabled = true;
                clearLogBtn.disabled = true;
                barkDogResetAllFilters();
                updateStatsAndTable();
                updateDatesDropdown();
                renderAnalyticsChart();
            } else {
                alert('Fehler beim Leeren des Protokolls.');
            }
        } catch (err) {
            console.error('Leeren fehlgeschlagen:', err);
            allEvents = [];
            highestConfidence = 0;
            statTotalBarks.textContent = '0';
            statLastDetection.textContent = '–';
            statTopConfidence.textContent = '0%';
            exportCsvBtn.disabled = true;
            clearLogBtn.disabled = true;
            barkDogResetAllFilters();
            updateStatsAndTable();
            updateDatesDropdown();
            renderAnalyticsChart();
        }
    }

    // Event Listener für Protokoll-Filter
    filterTimeRange.addEventListener('change', (e) => {
        const val = e.target.value;
        filterState.timeRange = val;
        filterState.chartHour = null;
        filterState.chartDate = null;

        const todayStr = getIsoDateString(new Date());

        if (val === 'today') {
            filterCustomDay.style.display = 'none';
            selectedDateStr = todayStr;
            dateSelect.value = todayStr;
            currentView = 'day';
            tabDayBtn.classList.add('active');
            tabWeekBtn.classList.remove('active');
            dayFilterBar.style.display = 'flex';
        } else if (val === 'week') {
            filterCustomDay.style.display = 'none';
            currentView = 'week';
            tabWeekBtn.classList.add('active');
            tabDayBtn.classList.remove('active');
            dayFilterBar.style.display = 'none';
        } else if (val === 'custom_day') {
            filterCustomDay.style.display = 'inline-block';
            filterState.customDay = filterCustomDay.value || todayStr;
            selectedDateStr = filterState.customDay;
            dateSelect.value = filterState.customDay;
            currentView = 'day';
            tabDayBtn.classList.add('active');
            tabWeekBtn.classList.remove('active');
            dayFilterBar.style.display = 'flex';
        } else if (val === 'all') {
            filterCustomDay.style.display = 'none';
        }

        applyFiltersAndRender(false);
    });

    if (groupEpisodesCheckbox) {
        groupEpisodesCheckbox.addEventListener('change', (e) => {
            filterState.groupByEpisodes = e.target.checked;
            localStorage.setItem(STORAGE_KEY_GROUP_EPISODES, String(filterState.groupByEpisodes));
            applyFiltersAndRender(false);
        });
    }

    filterCustomDay.addEventListener('change', (e) => {
        filterState.customDay = e.target.value;
        filterState.chartHour = null;
        filterState.chartDate = null;
        if (filterState.customDay) {
            selectedDateStr = filterState.customDay;
            dateSelect.value = filterState.customDay;
            currentView = 'day';
            tabDayBtn.classList.add('active');
            tabWeekBtn.classList.remove('active');
            dayFilterBar.style.display = 'flex';
        }
        applyFiltersAndRender(false);
    });

    /**
     * Schwellenwert auf dem Server fest im Programm (settings.json) sichern
     */
    async function persistThresholdToServer(val) {
        let num = parseFloat(val);
        if (isNaN(num)) num = 0;
        num = Math.max(0, Math.min(100, Math.round(num * 10) / 10));

        localStorage.setItem(STORAGE_KEY_CNN14_THRESHOLD, String(num));

        try {
            const res = await fetch(`/api/settings?cnn14Threshold=${num / 100.0}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cnn14Threshold: num / 100.0, cnn14ThresholdPct: num })
            });
            return res.ok;
        } catch (e) {
            console.warn('Settings-Sync fehlgeschlagen:', e);
            return false;
        }
    }

    let autoSaveTimer = null;
    function scheduleAutoSave(val) {
        if (autoSaveTimer) clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(() => {
            persistThresholdToServer(val);
        }, 1200);
    }

    /**
     * Schwellenwert synchron aktualisieren (Slider & Number Input & LocalStorage & Server-Persistenz)
     */
    function updateThreshold(val, triggerSource) {
        let num = parseFloat(val);
        if (isNaN(num)) num = 0;
        num = Math.max(0, Math.min(100, Math.round(num * 10) / 10));

        filterState.cnn14Threshold = num;

        if (triggerSource !== 'slider' && cnn14Slider) {
            cnn14Slider.value = num;
        }
        if (triggerSource !== 'input' && cnn14NumberInput) {
            cnn14NumberInput.value = num;
        }

        // Dauerhaft im Browser sichern
        localStorage.setItem(STORAGE_KEY_CNN14_THRESHOLD, String(num));

        // Automatisch im Hintergrund auch auf dem Server fest speichern
        scheduleAutoSave(num);

        applyFiltersAndRender(false);
    }

    if (cnn14Slider) {
        cnn14Slider.addEventListener('input', (e) => {
            updateThreshold(e.target.value, 'slider');
        });
    }

    if (cnn14NumberInput) {
        cnn14NumberInput.addEventListener('input', (e) => {
            updateThreshold(e.target.value, 'input');
        });
        cnn14NumberInput.addEventListener('change', (e) => {
            updateThreshold(e.target.value, 'input');
        });
    }

    if (saveCnn14ThresholdBtn) {
        saveCnn14ThresholdBtn.addEventListener('click', async () => {
            const val = filterState.cnn14Threshold;
            saveCnn14ThresholdBtn.disabled = true;
            const ok = await persistThresholdToServer(val);
            saveCnn14ThresholdBtn.disabled = false;

            if (cnn14SaveNotice) {
                cnn14SaveNotice.textContent = ok ? '✓ Fest im Programm gespeichert' : '⚠️ Lokal gespeichert (Server offline)';
                cnn14SaveNotice.style.display = 'inline-block';
                setTimeout(() => {
                    cnn14SaveNotice.style.display = 'none';
                }, 2500);
            }
        });
    }

    resetChartFilterBtn.addEventListener('click', () => {
        filterState.chartHour = null;
        filterState.chartDate = null;
        applyFiltersAndRender(false);
    });

    resetAllFiltersBtn.addEventListener('click', () => {
        window.barkDogResetAllFilters();
    });

    // Papierkorb Modal Event Listener
    openTrashBtn.addEventListener('click', () => {
        trashModal.style.display = 'flex';
        fetchTrash();
    });

    closeTrashBtn.addEventListener('click', () => {
        trashModal.style.display = 'none';
    });

    trashModal.addEventListener('click', (e) => {
        if (e.target === trashModal) {
            trashModal.style.display = 'none';
        }
    });

    clearTrashBtn.addEventListener('click', async () => {
        if (!confirm('Den Papierkorb und alle darin befindlichen Audioaufnahmen endgültig leeren?')) return;
        try {
            const res = await fetch('/api/trash/clear', { method: 'POST' });
            if (res.ok) {
                fetchTrash();
            } else {
                alert('Fehler beim Leeren des Papierkorbs.');
            }
        } catch (e) {
            console.error('Papierkorb leeren fehlgeschlagen:', e);
        }
    });

    /**
     * Lädt persistierte Einstellungen vom Server (fest im Programm aus settings.json)
     */
    async function fetchServerSettings() {
        try {
            let data = null;
            try {
                const res = await fetch('/api/settings');
                if (res.ok) data = await res.json();
            } catch (_) {}

            if (!data) {
                const resFallback = await fetch(`data/settings.json?t=${Date.now()}`);
                if (resFallback.ok) data = await resFallback.json();
            }

            if (data) {
                let thr = null;
                if (data.cnn14ThresholdPct !== undefined) {
                    thr = parseFloat(data.cnn14ThresholdPct);
                } else if (data.cnn14Threshold !== undefined) {
                    thr = parseFloat(data.cnn14Threshold) * 100.0;
                }
                if (thr !== null && !isNaN(thr)) {
                    thr = Math.max(0, Math.min(100, Math.round(thr * 10) / 10));
                    filterState.cnn14Threshold = thr;
                    if (cnn14Slider) cnn14Slider.value = thr;
                    if (cnn14NumberInput) cnn14NumberInput.value = thr;
                    localStorage.setItem(STORAGE_KEY_CNN14_THRESHOLD, String(thr));
                    applyFiltersAndRender(false);
                }
            }
        } catch (e) {
            console.debug('Server-Settings konnten nicht geladen werden:', e);
        }
    }

    // Sonstige Event Listener
    refreshDataBtn.addEventListener('click', () => {
        fetchServerStatus();
        fetchServerEvents();
        fetchTrash();
        fetchServerSettings();
    });
    demoAudioBtn.addEventListener('click', testDemoAudio);
    exportCsvBtn.addEventListener('click', exportCsv);
    clearLogBtn.addEventListener('click', clearLog);

    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const audio = new Audio(URL.createObjectURL(file));
            audio.play();
            alert(`Datei "${file.name}" wird abgespielt.`);
        }
    });

    // Tab-Umschaltung Tag / Woche (synchronisiert mit Protokoll-Filter)
    tabDayBtn.addEventListener('click', () => {
        currentView = 'day';
        tabDayBtn.classList.add('active');
        tabWeekBtn.classList.remove('active');
        dayFilterBar.style.display = 'flex';
        const todayStr = getIsoDateString(new Date());
        if (selectedDateStr === todayStr || !selectedDateStr) {
            filterState.timeRange = 'today';
            filterTimeRange.value = 'today';
            filterCustomDay.style.display = 'none';
        } else {
            filterState.timeRange = 'custom_day';
            filterState.customDay = selectedDateStr;
            filterTimeRange.value = 'custom_day';
            filterCustomDay.value = selectedDateStr;
            filterCustomDay.style.display = 'inline-block';
        }
        filterState.chartHour = null;
        filterState.chartDate = null;
        applyFiltersAndRender(false);
    });

    tabWeekBtn.addEventListener('click', () => {
        currentView = 'week';
        tabWeekBtn.classList.add('active');
        tabDayBtn.classList.remove('active');
        dayFilterBar.style.display = 'none';
        filterState.timeRange = 'week';
        filterTimeRange.value = 'week';
        filterCustomDay.style.display = 'none';
        filterState.chartHour = null;
        filterState.chartDate = null;
        applyFiltersAndRender(false);
    });

    dateSelect.addEventListener('change', (e) => {
        selectedDateStr = e.target.value;
        const todayStr = getIsoDateString(new Date());
        if (selectedDateStr === todayStr) {
            filterState.timeRange = 'today';
            filterTimeRange.value = 'today';
            filterCustomDay.style.display = 'none';
        } else {
            filterState.timeRange = 'custom_day';
            filterState.customDay = selectedDateStr;
            filterTimeRange.value = 'custom_day';
            filterCustomDay.value = selectedDateStr;
            filterCustomDay.style.display = 'inline-block';
        }
        filterState.chartHour = null;
        filterState.chartDate = null;
        applyFiltersAndRender(false);
    });

    btnSelectToday.addEventListener('click', () => {
        const todayStr = getIsoDateString(new Date());
        dateSelect.value = todayStr;
        selectedDateStr = todayStr;
        currentView = 'day';
        tabDayBtn.classList.add('active');
        tabWeekBtn.classList.remove('active');
        dayFilterBar.style.display = 'flex';
        filterState.timeRange = 'today';
        filterTimeRange.value = 'today';
        filterCustomDay.style.display = 'none';
        filterState.chartHour = null;
        filterState.chartDate = null;
        applyFiltersAndRender(false);
    });

    // =========================================================================
    // Filou KI-Trainer: Schnell-Klassifizierung & Active Learning
    // =========================================================================
    let trainerQueue = [];
    let trainerCurrentIndex = 0;
    let trainerAudioPlayer = null;
    let trainerStats = { totalBarks: 0, totalNoise: 0, profileActive: false };
    let currentTrainerSource = 'all';

    function renderLearningHistory(history) {
        if (!learningHistoryChart) return;
        if (!history || history.length === 0) {
            learningHistoryChart.innerHTML = '<div style="color: var(--text-muted); font-size: 0.8rem; padding: 0.5rem 0;">Noch keine Verlaufsdaten erfasst. Trainiere erste Clips!</div>';
            return;
        }
        const cardsHtml = history.map(h => {
            let formattedDate = h.date;
            if (h.date && h.date.includes('-')) {
                const parts = h.date.split('-');
                if (parts.length === 3) {
                    formattedDate = `${parts[2]}.${parts[1]}.${parts[0].slice(2)}`;
                }
            }
            return `
                <div class="learning-day-card">
                    <span class="day-date">${formattedDate}</span>
                    <div class="day-stats">
                        <span class="day-barks" title="Beller">+${h.barks} 🐶</span>
                        <span class="day-noise" title="Fehlalarme">+${h.noise} ❌</span>
                    </div>
                </div>
            `;
        }).join('');
        learningHistoryChart.innerHTML = cardsHtml;
    }

    async function fetchTrainerStats() {
        try {
            const res = await fetch(`/api/trainer/stats?t=${Date.now()}`);
            if (res.ok) {
                trainerStats = await res.json();
                if (trainerCountBadge) {
                    if (trainerStats.queueLength > 0) {
                        trainerCountBadge.textContent = trainerStats.queueLength;
                        trainerCountBadge.style.display = 'inline-block';
                    } else {
                        trainerCountBadge.style.display = 'none';
                    }
                }
                if (trainerStatBarks) trainerStatBarks.textContent = trainerStats.totalBarks || 0;
                if (trainerStatNoise) trainerStatNoise.textContent = trainerStats.totalNoise || 0;
                if (trainerProfileStatus) {
                    trainerProfileStatus.style.display = trainerStats.profileActive ? 'inline-flex' : 'none';
                }

                // Modell-Reifegrad & Zuverlässigkeits-Pill
                if (trainerLevelPill && trainerStats.level) {
                    trainerLevelPill.textContent = `⭐ ${trainerStats.level.name}`;
                }
                if (trainerDiscriminationPill && trainerStats.discriminationPct !== undefined) {
                    trainerDiscriminationPill.textContent = `🎯 ${trainerStats.discriminationPct}% Zuverlässigkeit`;
                }

                // Queue-Zähler nach Quelle
                if (queueCountAll) queueCountAll.textContent = trainerStats.queueCounts?.all ?? (trainerStats.queueLength || 0);
                if (queueCountTrash) queueCountTrash.textContent = trainerStats.queueCounts?.trash ?? 0;
                if (queueCountEvents) queueCountEvents.textContent = trainerStats.queueCounts?.events ?? 0;

                // Lernkurve-Sektion
                if (learningLevelSubtitle && trainerStats.level) {
                    learningLevelSubtitle.textContent = `${trainerStats.level.name} • ${trainerStats.totalLabeled || 0} Muster trainiert`;
                }
                if (levelProgressText && trainerStats.level) {
                    levelProgressText.textContent = `Fortschritt zu ${trainerStats.level.next} (${trainerStats.totalLabeled || 0}/${trainerStats.level.target})`;
                }
                if (levelProgressPct && trainerStats.level) {
                    levelProgressPct.textContent = `${trainerStats.level.progressPct}%`;
                }
                if (levelProgressFill && trainerStats.level) {
                    levelProgressFill.style.width = `${trainerStats.level.progressPct}%`;
                }

                // Verlaufshistorie
                renderLearningHistory(trainerStats.history);
            }
        } catch (e) {
            console.debug('Fehler beim Abruf der Trainer-Stats:', e);
        }
    }

    async function loadTrainerQueue(source = 'all') {
        currentTrainerSource = source;

        // Tabs im UI umschalten
        document.querySelectorAll('.source-tab-btn').forEach(btn => {
            if (btn.dataset.source === source) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        if (trainerProgressText) trainerProgressText.textContent = 'Lade Clips...';
        if (trainerProgressBarFill) trainerProgressBarFill.style.width = '0%';
        if (trainerEmptyState) trainerEmptyState.style.display = 'none';
        if (trainerCard) trainerCard.style.display = 'flex';

        try {
            const res = await fetch(`/api/trainer/queue?source=${encodeURIComponent(source)}&t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                trainerQueue = data.queue || [];
                trainerCurrentIndex = 0;
                if (trainerQueue.length === 0) {
                    showTrainerEmptyState();
                } else {
                    loadTrainerClip(0);
                }
            } else {
                showTrainerEmptyState();
            }
        } catch (e) {
            console.error('Trainer-Queue Fehler:', e);
            showTrainerEmptyState();
        }
    }

    async function openTrainerModal() {
        if (!trainerModal) return;
        trainerModal.style.display = 'flex';
        trainerProgressText.textContent = 'Lade Clips...';
        trainerProgressBarFill.style.width = '0%';
        trainerEmptyState.style.display = 'none';
        trainerCard.style.display = 'flex';

        await fetchTrainerStats();
        await loadTrainerQueue(currentTrainerSource || 'all');
    }

    function stopTrainerAudio(resumeServer = true) {
        if (trainerAudioPlayer) {
            trainerAudioPlayer.loop = false;
            trainerAudioPlayer.pause();
            trainerAudioPlayer = null;
        }
        if (trainerPlayBtn) {
            trainerPlayBtn.classList.remove('playing');
        }
        updateTrainerPlayIcon(false);
        if (resumeServer) {
            fetch('/api/resume', { method: 'POST' }).catch(() => {});
        }
    }

    function pauseTrainerAudio() {
        if (trainerAudioPlayer && !trainerAudioPlayer.paused) {
            stopTrainerAudio(true);
            if (trainerPlayerStatus) {
                trainerPlayerStatus.textContent = '⏸️ Pausiert (Leertaste / Klick zum Weiterhören)';
            }
        }
    }

    function closeTrainerModal() {
        stopTrainerAudio(true);
        if (trainerModal) {
            trainerModal.style.display = 'none';
        }
        fetchServerEvents();
        fetchTrash();
        fetchTrainerStats();
    }

    function showTrainerEmptyState() {
        stopTrainerAudio(true);
        trainerEmptyState.style.display = 'block';
        trainerCard.style.display = 'none';
        trainerProgressText.textContent = 'Fertig!';
        trainerProgressBarFill.style.width = '100%';
        if (trainerCountBadge) trainerCountBadge.style.display = 'none';
    }

    function loadTrainerClip(index) {
        if (index >= trainerQueue.length) {
            showTrainerEmptyState();
            return;
        }

        const isAutoPlay = trainerAutoPlayCheckbox && trainerAutoPlayCheckbox.checked;
        stopTrainerAudio(!isAutoPlay);

        const clip = trainerQueue[index];
        trainerCurrentIndex = index;

        const currentNum = index + 1;
        const totalNum = trainerQueue.length;
        trainerProgressText.textContent = `Clip ${currentNum} von ${totalNum}`;
        const pct = Math.round((currentNum / totalNum) * 100);
        trainerProgressBarFill.style.width = `${pct}%`;

        trainerClipTime.textContent = clip.timeFormatted || '--:--:--';
        trainerClipDate.textContent = clip.dateFormatted || '--.--.----';

        if (trainerClipSourceBadge) {
            trainerClipSourceBadge.textContent = clip.sourceLabel || (clip.source === 'trash' ? 'Papierkorb' : 'Beller-Protokoll');
        }

        const yConf = clip.yamnet?.confidencePct || '0';
        trainerYamnetScore.textContent = `YAMNet: ${yConf}%`;

        const cConf = clip.cnn14?.confidencePct || '0';
        trainerCnn14Score.textContent = `CNN14: ${cConf}%`;

        const topClass = clip.cnn14?.topClass || clip.reason || 'Unbestätigtes Geräusch';
        trainerClipReason.textContent = `Einstufung: ${topClass}`;

        // Live KI-Vorhersage des Modells
        if (trainerAiPredBadge && clip.aiPrediction) {
            trainerAiPredBadge.textContent = clip.aiPrediction.label || 'Prüft...';
            trainerAiPredBadge.className = `ai-pred-badge badge-${clip.aiPrediction.badgeType || 'neutral'}`;
        }
        if (trainerAiPredDetail && clip.aiPrediction) {
            trainerAiPredDetail.textContent = clip.aiPrediction.detail || '';
        }

        trainerPlayerStatus.textContent = isAutoPlay ? '🔁 Endlosschleife startet...' : 'Bereit (Wiedergabe in Endlosschleife)';
        trainerPlayBtn.classList.remove('playing');
        updateTrainerPlayIcon(false);

        // Auto-Play in Endlosschleife
        if (isAutoPlay) {
            playCurrentTrainerClip();
        }
    }

    function updateTrainerPlayIcon(isPlaying) {
        if (!trainerPlayIcon) return;
        if (isPlaying) {
            trainerPlayIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
        } else {
            trainerPlayIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
        }
    }

    async function playCurrentTrainerClip() {
        if (trainerCurrentIndex >= trainerQueue.length) return;
        const clip = trainerQueue[trainerCurrentIndex];
        if (!clip.audioUrl) return;

        stopTrainerAudio(false);

        try {
            // Detektor-Mikrofon während der Wiedergabe in Endlosschleife pausieren
            fetch('/api/pause?duration=120.0', { method: 'POST' }).catch(() => {});

            trainerAudioPlayer = new Audio(`${clip.audioUrl}?t=${Date.now()}`);
            trainerAudioPlayer.loop = true; // Wiedergabe in Endlosschleife bis Entscheidung

            trainerPlayBtn.classList.add('playing');
            updateTrainerPlayIcon(true);
            trainerPlayerStatus.textContent = '🔁 Endlosschleife läuft... Jetzt entscheiden!';

            // Fallback: Falls Browser onended auslöst trotz loop
            trainerAudioPlayer.onended = () => {
                if (trainerAudioPlayer && trainerAudioPlayer.loop) {
                    trainerAudioPlayer.currentTime = 0;
                    trainerAudioPlayer.play().catch(() => {});
                }
            };

            trainerAudioPlayer.onerror = () => {
                stopTrainerAudio(true);
                trainerPlayerStatus.textContent = 'Audiodatei konnte nicht geladen werden.';
            };

            await trainerAudioPlayer.play();
        } catch (e) {
            console.warn('Wiedergabefehler im Trainer:', e);
            stopTrainerAudio(true);
            trainerPlayerStatus.textContent = 'Autoplay blockiert (Klick auf Play nötig)';
        }
    }

    async function submitTrainerVote(label) {
        if (trainerCurrentIndex >= trainerQueue.length) return;
        const clip = trainerQueue[trainerCurrentIndex];

        // Vorbereitung für nächsten Clip
        stopTrainerAudio(false);

        // Feedback-Animation
        const activeBtn = label === 'bark' ? btnVoteYes : btnVoteNo;
        if (activeBtn) {
            activeBtn.style.transform = 'scale(0.96)';
            setTimeout(() => { activeBtn.style.transform = ''; }, 120);
        }

        try {
            const res = await fetch('/api/trainer/label', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: clip.id, label: label })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.stats) {
                    if (trainerStatBarks) trainerStatBarks.textContent = data.stats.totalBarks;
                    if (trainerStatNoise) trainerStatNoise.textContent = data.stats.totalNoise;
                    if (trainerProfileStatus) trainerProfileStatus.style.display = data.stats.profileActive ? 'inline-flex' : 'none';
                }
                // Stats im Hintergrund neu laden, damit Level, Zuverlässigkeit und History direkt nachziehen
                fetchTrainerStats();
            }
        } catch (e) {
            console.error('Fehler beim Speichern der Bewertung:', e);
        }

        // Nächster Clip
        loadTrainerClip(trainerCurrentIndex + 1);
    }

    // Event Listener für Filou KI-Trainer
    if (openTrainerBtn) openTrainerBtn.addEventListener('click', openTrainerModal);
    if (closeTrainerBtn) closeTrainerBtn.addEventListener('click', closeTrainerModal);
    if (btnTrainerDone) btnTrainerDone.addEventListener('click', closeTrainerModal);

    // Source Tabs Umschalter
    document.querySelectorAll('.source-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const src = btn.dataset.source || 'all';
            loadTrainerQueue(src);
        });
    });

    // Modell-Lernkurve auf-/zuklappen
    if (toggleLearningCurveBtn && learningCurveBody) {
        toggleLearningCurveBtn.addEventListener('click', () => {
            const isCollapsed = learningCurveBody.style.display === 'none';
            learningCurveBody.style.display = isCollapsed ? 'block' : 'none';
            const icon = document.getElementById('learningCurveToggleIcon');
            if (icon) icon.textContent = isCollapsed ? '▲' : '▼';
            if (isCollapsed) {
                setTimeout(() => {
                    toggleLearningCurveBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 60);
            }
        });
    }

    if (trainerModal) {
        trainerModal.addEventListener('click', (e) => {
            if (e.target === trainerModal) {
                closeTrainerModal();
            }
        });
    }

    if (trainerPlayBtn) {
        trainerPlayBtn.addEventListener('click', () => {
            if (trainerAudioPlayer && !trainerAudioPlayer.paused) {
                pauseTrainerAudio();
            } else {
                playCurrentTrainerClip();
            }
        });
    }

    if (btnVoteNo) btnVoteNo.addEventListener('click', () => submitTrainerVote('noise'));
    if (btnVoteYes) btnVoteYes.addEventListener('click', () => submitTrainerVote('bark'));
    if (btnVoteSkip) btnVoteSkip.addEventListener('click', () => loadTrainerClip(trainerCurrentIndex + 1));

    // Globale Tastatursteuerung für den KI-Trainer
    window.addEventListener('keydown', (e) => {
        if (!trainerModal || trainerModal.style.display !== 'flex') return;

        if (e.key === 'Escape') {
            closeTrainerModal();
        } else if (e.key === 'ArrowRight' || e.key === 'j' || e.key === 'J' || e.key === 'y' || e.key === 'Y') {
            e.preventDefault();
            submitTrainerVote('bark');
        } else if (e.key === 'ArrowLeft' || e.key === 'n' || e.key === 'N') {
            e.preventDefault();
            submitTrainerVote('noise');
        } else if (e.key === ' ' || e.code === 'Space') {
            e.preventDefault();
            if (trainerAudioPlayer && !trainerAudioPlayer.paused) {
                pauseTrainerAudio();
            } else {
                playCurrentTrainerClip();
            }
        } else if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
            e.preventDefault();
            loadTrainerClip(trainerCurrentIndex + 1);
        }
    });

    // Initialer Aufruf
    fetchServerSettings();
    fetchServerStatus();
    fetchServerEvents();
    fetchTrash();
    fetchTrainerStats();

    // Schnelles Polling für den Live-Pegelbalken (alle 500ms)
    setInterval(fetchServerStatus, 500);

    // Event- & Papierkorb-Aktualisierung alle 2 Sekunden
    setInterval(fetchServerEvents, 2000);
})();
