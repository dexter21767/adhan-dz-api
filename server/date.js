function toYmdLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

const GREGORIAN_MONTH_NAMES_EN = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

const GREGORIAN_MONTH_NAMES_AR = [
    'جانفي',
    'فيفري',
    'مارس',
    'أفريل',
    'ماي',
    'جوان',
    'جويلية',
    'أوت',
    'سبتمبر',
    'أكتوبر',
    'نوفمبر',
    'ديسمبر',
];

const HIJRI_MONTH_NAMES_EN = [
    'Muharram',
    'Safar',
    "Rabi' al-Awwal",
    "Rabi' al-Thani",
    'Jumada al-Awwal',
    'Jumada al-Thani',
    'Rajab',
    "Sha'ban",
    'Ramadan',
    'Shawwal',
    "Dhu al-Qi'dah",
    'Dhu al-Hijjah',
];

const HIJRI_MONTH_NAMES_AR = [
    'محرم',
    'صفر',
    'ربيع الأول',
    'ربيع الآخر',
    'جمادى الأولى',
    'جمادى الآخرة',
    'رجب',
    'شعبان',
    'رمضان',
    'شوال',
    'ذو القعدة',
    'ذو الحجة',
];

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

function getTodayYmd() {
    return toYmdLocal(new Date());
}

function addDaysToYmd(ymd, days) {
    const [year, month, day] = ymd.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + days);
    return toYmdLocal(date);
}

function parseYmd(ymd) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd || '');
    if (!match) {
        return null;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(day) || day < 1 || day > 31) {
        return null;
    }

    return { year, month, day };
}

function parseDmy(dmy) {
    const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(dmy || '');
    if (!match) {
        return null;
    }

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(day) || day < 1 || day > 31) {
        return null;
    }

    return { year, month, day };
}

function toArabicDigits(value) {
    return String(value).replace(/\d/g, (digit) => ARABIC_DIGITS[Number(digit)]);
}

function formatGregorianDateEn(ymd) {
    const parsed = parseYmd(ymd);
    if (!parsed) {
        return null;
    }

    return `${parsed.day} ${GREGORIAN_MONTH_NAMES_EN[parsed.month - 1]} ${parsed.year}`;
}

function formatGregorianDateAr(ymd) {
    const parsed = parseYmd(ymd);
    if (!parsed) {
        return null;
    }

    return `${toArabicDigits(parsed.day)} ${GREGORIAN_MONTH_NAMES_AR[parsed.month - 1]} ${toArabicDigits(parsed.year)}`;
}

function formatHijriDateEn(hijriDate) {
    const parsed = parseDmy(hijriDate);
    if (!parsed) {
        return null;
    }

    return `${parsed.day} ${HIJRI_MONTH_NAMES_EN[parsed.month - 1]} ${parsed.year}`;
}

function formatHijriDateAr(hijriDate) {
    const parsed = parseDmy(hijriDate);
    if (!parsed) {
        return null;
    }

    return `${toArabicDigits(parsed.day)} ${HIJRI_MONTH_NAMES_AR[parsed.month - 1]} ${toArabicDigits(parsed.year)}`;
}

module.exports = {
    getTodayYmd,
    addDaysToYmd,
    formatGregorianDateEn,
    formatGregorianDateAr,
    formatHijriDateEn,
    formatHijriDateAr,
};
