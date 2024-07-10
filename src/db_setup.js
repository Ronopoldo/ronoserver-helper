const {throwErr} = require("./core_functions");

function launch(sqlite3, dbPath) {
    /**
     * Подключение к Базе Данных
     */
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Ошибка подключения к базе данных:', err);
        } else {
            console.log('Подключение к базе данных успешно установлено.');
        }


    });

    /**
     * Создание БД для хранения данных юзеров
     */
    db.serialize(() => {
        db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            discord_id TEXT NOT NULL,
            telegram_id NOT NULL,
            roles TEXT NOT NULL,
            stream_hours INTEGER NOT NULL,
            restore_complete BOOLEAN NOT NULL
        )
    `, (err) => {
            if (err) {
                console.error('Ошибка создания таблицы:', err);
            } else {
                console.log('Таблица успешно создана или уже существует.');
            }
        });
    });

    return db
}


async function addUser(db, userId) {
    const query = 'INSERT INTO users (discord_id, telegram_id, roles, stream_hours, restore_complete) VALUES (?, ?, ?, ?, ?)';
    db.run(query, [userId, "-1", "[]", 0, false], function(err) {
        if (err) {
            console.error('Ошибка добавления данных пользователя:', err);
        } else {
            console.log('Данные пользователя успешно добавлены:', this.lastID);
        }
    });
}


function getUser(db, userId, callback) {
    const query = 'SELECT * FROM users WHERE discord_id = ?';
    db.get(query, [userId], (err, row) => {
        if (err) {
            console.error('Ошибка получения данных пользователя:', err);
            callback(err);
        } else {
            callback(null, row);
        }
    });
}


async function checkReg(db, discordId, throwErr) {
    return new Promise((resolve, reject) => {
        const query = 'SELECT COUNT(*) AS count FROM users WHERE discord_id = ?';

        db.get(query, [discordId], function (err, row) {
            if (err) {
                throwErr(msg, err);
                reject(err);
                return;
            }

            const userExists = row.count > 0;
            resolve(userExists);
        });
    });
}


async function getUserData(db, discordId, column, throwErr) {
    const query = `SELECT ${column} FROM users WHERE discord_id = ?`;

    return new Promise((resolve, reject) => {
        db.get(query, [discordId], function(err, row) {
            if (err) {
                throwErr(msg, err);
                reject(err);
                return;
            }

            if (!row) {
                const errorMessage = `Пользователь с discord_id ${discordId} не найден`;
                throwErr(msg, new Error(errorMessage));
                reject(new Error(errorMessage));
                return;
            }

            const value = row[column];
            console.log(`Значение ${value} получено из столбца ${column} для пользователя с discord_id ${discordId}`);
            resolve(value);
        });
    });
}

async function updateData(db, discordId, column, value, throwErr) {
    const query = `UPDATE users SET ${column} = ? WHERE discord_id = ?`;

    return new Promise((resolve, reject) => {
        db.run(query, [value, discordId], function(err) {
            if (err) {
                throwErr(msg, err);
                reject(err);
                return;
            }

            console.log(`Значение ${value} успешно записано в столбец ${column} для пользователя с discord_id ${discordId}`);
            resolve();
        });
    });
}



module.exports = {launch, addUser, getUser, getUserData, checkReg, updateData}