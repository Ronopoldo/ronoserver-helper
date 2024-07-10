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

function checkReg(db, discordId, callback) {
    const query = 'SELECT COUNT(*) AS count FROM users WHERE discord_id = ?';

    db.get(query, [discordId], (err, row) => {
        if (err) {
            console.error('Ошибка при проверке пользователя:', err);
            return callback(err, null);
        }

        const userExists = row.count > 0;
        callback(null, userExists);
    });
}


module.exports = {launch, addUser, getUser, checkReg}