const STORAGE_KEY = 'adhan_dz_city_selection';
const API_BASE_URL = 'https://adhan-dz.dexter21767.com';
const ALGIERS_TZ = 'Africa/Algiers';

const PRAYER_FIELDS = [
    { key: 'Fajr', label: 'Fajr', labelAr: 'الفجر', iconSrc: '/icons/fajr.svg', iconAlt: 'Fajr icon', iconFallback: '◔' },
    { key: 'Shurooq', label: 'Sunrise', labelAr: 'الشروق', iconSrc: '/icons/sunrise.svg', iconAlt: 'Sunrise icon', iconFallback: '☼' },
    { key: 'Dhuhr', label: 'Dhuhr', labelAr: 'الظهر', iconSrc: '/icons/dhuhr.svg', iconAlt: 'Dhuhr icon', iconFallback: '☀' },
    { key: 'Asr', label: 'Asr', labelAr: 'العصر', iconSrc: '/icons/asr.svg', iconAlt: 'Asr icon', iconFallback: '◉' },
    { key: 'Maghrib', label: 'Maghrib', labelAr: 'المغرب', iconSrc: '/icons/maghrib.svg', iconAlt: 'Maghrib icon', iconFallback: '◒' },
    { key: 'Isha', label: 'Isha', labelAr: 'العشاء', iconSrc: '/icons/isha.svg', iconAlt: 'Isha icon', iconFallback: '☾' },
];

const nowPartsFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: ALGIERS_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
});

const fullDateFormatter = new Intl.DateTimeFormat('ar-DZ', {
    timeZone: ALGIERS_TZ,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
});

const localClockFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: ALGIERS_TZ,
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
});

const citySelect = document.getElementById('citySelect');
const refreshBtn = document.getElementById('refreshBtn');
const controlsSection = document.querySelector('.controls');
const cityQuickBar = document.getElementById('cityQuickBar');
const cityQuickLabel = document.getElementById('cityQuickLabel');
const changeCityBtn = document.getElementById('changeCityBtn');
const pageTitleEl = document.getElementById('pageTitle');
const todayDisplayEl = document.getElementById('todayDisplay');
const selectedCityNameEl = document.getElementById('selectedCityName');
const dataDateEl = document.getElementById('dataDate');
const statusMessageEl = document.getElementById('statusMessage');
const prayerGridEl = document.getElementById('prayerGrid');
const nextPrayerLabelEl = document.getElementById('nextPrayerLabel');
const countdownValueEl = document.getElementById('countdownValue');
const countdownSubEl = document.getElementById('countdownSub');
const localTimeValueEl = document.getElementById('localTimeValue');

const state = {
    cityName: '',
    todayYmd: '',
    tomorrowYmd: '',
    todayRow: null,
    tomorrowRow: null,
};

let tickIntervalId = null;
const prayerCardMap = new Map();

function applyDirectionByLanguage() {
    const language = (document.documentElement.lang || 'ar').toLowerCase();
    document.documentElement.dir = language.startsWith('ar') ? 'rtl' : 'ltr';
}

function setControlsCollapsed(collapsed) {
    controlsSection.classList.toggle('collapsed', collapsed);
    cityQuickBar.classList.toggle('hidden', !collapsed);
}

function updateQuickCityLabel(cityName) {
    cityQuickLabel.textContent = `المدينة: ${cityName || '-'}`;
}

function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        return;
    }

    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {
            // Ignore service worker registration failures.
        });
    });
}

function getDatePartsMap(formatter, date = new Date()) {
    const parts = formatter.formatToParts(date);
    const map = {};
    parts.forEach((part) => {
        if (part.type !== 'literal') {
            map[part.type] = part.value;
        }
    });
    return map;
}

function getAlgiersNowParts() {
    return getDatePartsMap(nowPartsFormatter, new Date());
}

function addDaysToYmd(ymd, days) {
    const [year, month, day] = ymd.split('-').map(Number);
    const utcDate = new Date(Date.UTC(year, month - 1, day));
    utcDate.setUTCDate(utcDate.getUTCDate() + days);
    return utcDate.toISOString().slice(0, 10);
}

function parsePrayerTimeToSeconds(value) {
    if (!value) {
        return null;
    }

    const match = String(value).trim().match(/^(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?$/);
    if (!match) {
        return null;
    }

    let hour = Number(match[1]);
    const minute = Number(match[2]);
    const meridiem = match[3] ? match[3].toLowerCase() : null;

    if (meridiem) {
        if (hour === 12) {
            hour = 0;
        }
        if (meridiem === 'pm') {
            hour += 12;
        }
    }

    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
        return null;
    }

    return (hour * 3600) + (minute * 60);
}

function formatPrayerTime(value) {
    const totalSeconds = parsePrayerTimeToSeconds(value);
    if (totalSeconds === null) {
        return '--:--';
    }

    const hours24 = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const suffix = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = (hours24 % 12) || 12;
    return `${hours12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

function formatDuration(seconds) {
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const secs = safeSeconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function setStatus(message, isError = false) {
    statusMessageEl.textContent = message;
    statusMessageEl.classList.toggle('error', isError);
}

async function fetchJson(path) {
    const response = await fetch(`${API_BASE_URL}${path}`);
    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
    }
    return response.json();
}

function normalizeCities(cities) {
    return cities
        .map((city) => ({
            selectId: String(city._id),
            queryId: String(city.ParentId || city._id),
            name: city.MADINA_NAME,
        }))
        .sort((a, b) => a.name.localeCompare(b.name, 'ar'));
}

function getStoredCitySelection() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return null;
        }

        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') {
            return null;
        }

        const cityId = parsed.cityId ? String(parsed.cityId) : '';
        const queryId = parsed.queryId ? String(parsed.queryId) : '';
        if (!cityId || !queryId) {
            return null;
        }

        return { cityId, queryId };
    } catch (_) {
        return null;
    }
}

function saveCitySelection(cityId, queryId) {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                cityId: String(cityId),
                queryId: String(queryId),
            })
        );
    } catch (_) {
        // Ignore localStorage failures.
    }
}

function renderPrayerCards(prayerRow) {
    prayerGridEl.innerHTML = '';
    prayerCardMap.clear();

    PRAYER_FIELDS.forEach((field) => {
        const card = document.createElement('article');
        card.className = 'prayer-card';
        card.dataset.key = field.key;

        const time = document.createElement('p');
        time.className = 'prayer-time';
        time.textContent = formatPrayerTime(prayerRow[field.key]);

        const icon = document.createElement('p');
        icon.className = 'prayer-icon';
        if (field.iconSrc) {
            const iconImage = document.createElement('img');
            iconImage.className = 'prayer-icon-image';
            iconImage.src = field.iconSrc;
            iconImage.alt = field.iconAlt || `${field.label} icon`;
            iconImage.addEventListener('error', () => {
                iconImage.remove();
                icon.textContent = field.iconFallback || '•';
            });
            icon.appendChild(iconImage);
        } else {
            icon.textContent = field.iconFallback || '•';
        }

        const name = document.createElement('p');
        name.className = 'prayer-name';
        name.textContent = field.labelAr;

        const nameAr = document.createElement('p');
        nameAr.className = 'prayer-name-ar';
        nameAr.textContent = field.label;

        card.appendChild(time);
        card.appendChild(icon);
        card.appendChild(name);
        card.appendChild(nameAr);
        prayerGridEl.appendChild(card);

        prayerCardMap.set(field.key, card);
    });
}

function highlightUpcomingPrayer(nextKey) {
    prayerCardMap.forEach((card, key) => {
        card.classList.toggle('upcoming', key === nextKey);
    });
}

function findNextPrayerInfo() {
    if (!state.todayRow) {
        return null;
    }

    const nowParts = getAlgiersNowParts();
    const nowSeconds = (Number(nowParts.hour) * 3600) + (Number(nowParts.minute) * 60) + Number(nowParts.second);

    for (const field of PRAYER_FIELDS) {
        const prayerSeconds = parsePrayerTimeToSeconds(state.todayRow[field.key]);
        if (prayerSeconds !== null && prayerSeconds > nowSeconds) {
            return {
                field,
                timeRaw: state.todayRow[field.key],
                remainingSeconds: prayerSeconds - nowSeconds,
                isTomorrow: false,
            };
        }
    }

    const tomorrowFajrRaw = state.tomorrowRow?.Fajr || state.todayRow.Fajr;
    const tomorrowFajrSeconds = parsePrayerTimeToSeconds(tomorrowFajrRaw);
    if (tomorrowFajrSeconds === null) {
        return null;
    }

    return {
        field: PRAYER_FIELDS[0],
        timeRaw: tomorrowFajrRaw,
        remainingSeconds: (24 * 3600) - nowSeconds + tomorrowFajrSeconds,
        isTomorrow: true,
    };
}

function updateLocalClock() {
    localTimeValueEl.textContent = localClockFormatter.format(new Date());
}

function updateCountdownAndHighlight() {
    updateLocalClock();

    const nextInfo = findNextPrayerInfo();
    if (!nextInfo) {
        nextPrayerLabelEl.textContent = 'الصلاة القادمة | Next Prayer';
        countdownValueEl.textContent = '--:--:--';
        countdownSubEl.textContent = 'غير متاح | Unavailable';
        highlightUpcomingPrayer('');
        return;
    }

    const displayName = `${nextInfo.field.labelAr} | ${nextInfo.field.label}`;
    const displayTime = formatPrayerTime(nextInfo.timeRaw);

    nextPrayerLabelEl.textContent = `${displayName} (${displayTime})`;
    countdownValueEl.textContent = formatDuration(nextInfo.remainingSeconds);
    countdownSubEl.textContent = nextInfo.isTomorrow
        ? 'المتبقي لفجر الغد | Remaining to tomorrow Fajr'
        : 'الوقت المتبقي | Remaining time';

    highlightUpcomingPrayer(nextInfo.field.key);
}

function startTicking() {
    if (tickIntervalId) {
        clearInterval(tickIntervalId);
    }

    updateCountdownAndHighlight();
    tickIntervalId = setInterval(updateCountdownAndHighlight, 1000);
}

function clearPrayerData() {
    state.todayRow = null;
    state.tomorrowRow = null;
    prayerGridEl.innerHTML = '';
    prayerCardMap.clear();
    nextPrayerLabelEl.textContent = 'الصلاة القادمة | Next Prayer';
    countdownValueEl.textContent = '--:--:--';
    countdownSubEl.textContent = 'الوقت المتبقي | Remaining time';
}

async function loadPrayerTimesForSelectedCity() {
    const selectedOption = citySelect.options[citySelect.selectedIndex];
    const selectedCityId = citySelect.value;
    const queryCityId = selectedOption?.dataset.queryId || selectedCityId;

    if (!selectedCityId || !queryCityId) {
        setStatus('اختر مدينة. | Select a city.', true);
        clearPrayerData();
        return;
    }

    const cityName = selectedOption.textContent;
    state.cityName = cityName;
    selectedCityNameEl.textContent = cityName;
    updateQuickCityLabel(cityName);
    pageTitleEl.textContent = `مواقيت الصلاة والأذان - ${cityName}`;
    setStatus('جار تحميل المواقيت... | Loading prayer times...');

    saveCitySelection(selectedCityId, queryCityId);

    const nowParts = getAlgiersNowParts();
    const todayYmd = `${nowParts.year}-${nowParts.month}-${nowParts.day}`;
    const tomorrowYmd = addDaysToYmd(todayYmd, 1);

    try {
        const rows = await fetchJson(`/prayerTimes?cityId=${encodeURIComponent(queryCityId)}&startDate=${todayYmd}&endDate=${tomorrowYmd}`);

        if (!Array.isArray(rows) || rows.length === 0) {
            dataDateEl.textContent = '-';
            clearPrayerData();
            setStatus('لا توجد مواقيت متاحة لهذه المدينة. | No prayer times found for this city.', true);
            return;
        }

        const todayRow = rows.find((row) => row.GeoDate === todayYmd) || rows[0];
        const tomorrowRow = rows.find((row) => row.GeoDate === tomorrowYmd) || null;

        state.todayYmd = todayYmd;
        state.tomorrowYmd = tomorrowYmd;
        state.todayRow = todayRow;
        state.tomorrowRow = tomorrowRow;

        dataDateEl.textContent = todayRow.GeoDate || todayYmd;
        renderPrayerCards(todayRow);
        startTicking();
        setStatus('تم تحميل المواقيت. | Prayer times loaded.');
    } catch (error) {
        dataDateEl.textContent = '-';
        clearPrayerData();
        setStatus(`تعذر تحميل المواقيت. | Unable to load prayer times (${error.message}).`, true);
    }
}

async function init() {
    applyDirectionByLanguage();
    registerServiceWorker();
    todayDisplayEl.textContent = `تاريخ الجزائر: ${fullDateFormatter.format(new Date())}`;
    startTicking();
    setStatus('جار تحميل المدن... | Loading cities...');

    try {
        const cities = await fetchJson('/cities');
        const normalizedCities = normalizeCities(cities);

        if (normalizedCities.length === 0) {
            setStatus('لا توجد مدن متاحة. | No cities available.', true);
            return;
        }

        normalizedCities.forEach((city) => {
            const option = document.createElement('option');
            option.value = city.selectId;
            option.dataset.queryId = city.queryId;
            option.textContent = city.name;
            citySelect.appendChild(option);
        });

        const storedSelection = getStoredCitySelection();
        const savedCityId = storedSelection?.cityId || '';

        const hasExactSavedCity = normalizedCities.some((city) => city.selectId === savedCityId);
        citySelect.value = hasExactSavedCity ? savedCityId : normalizedCities[0].selectId;
        setControlsCollapsed(hasExactSavedCity);

        await loadPrayerTimesForSelectedCity();
    } catch (error) {
        setStatus(`تعذر تحميل قائمة المدن. | Unable to load city list (${error.message}).`, true);
    }
}

citySelect.addEventListener('change', loadPrayerTimesForSelectedCity);
refreshBtn.addEventListener('click', loadPrayerTimesForSelectedCity);
changeCityBtn.addEventListener('click', () => {
    setControlsCollapsed(false);
    citySelect.focus();
});

init();
