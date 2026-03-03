function toYmdLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getTodayYmd() {
    return toYmdLocal(new Date());
}

function addDaysToYmd(ymd, days) {
    const [year, month, day] = ymd.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + days);
    return toYmdLocal(date);
}

module.exports = {
    getTodayYmd,
    addDaysToYmd,
};
