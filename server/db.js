const sqlite3 = require('sqlite3').verbose();

class Database {
    constructor(config) {
        this.db = new sqlite3.Database(config.db, sqlite3.OPEN_READONLY);
    }

    query(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }
    getCities(){
        return this.query('SELECT * FROM itc_tab_madina')
    }
    getPrayerTimes({cityId, startDate, endDate}){
        const query = [];
        const params = [];
        if (cityId){
            params.push(cityId);
            query.push('MADINA_ID = ?');
        }
        if(!startDate)
            startDate = new Date().toISOString().split('T')[0];
        
        params.push(startDate);
        if(endDate){
            params.push(endDate);
            query.push('GeoDate BETWEEN ? AND ?');
        }
        else
            query.push('GeoDate = ?');
        
        const sql = `SELECT * FROM itc_tab_mawakit_salat WHERE ${query.join(' AND ')}`;
        return this.query(sql, params);
    }

    close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
}

module.exports = Database;