const {throwErr} = require("./core_functions");

/**
 * Запуск базы данных. Её создание и иницализация в db.
 * Стобцы базы данных:
 *             id: порядковый номер в БД.
 *             discord_id: ID в Discord.
 *             telegram_id: ID в Telegram.
 *             preferred_language: предпочитаемый язык пользователя.
 *             roles: легаси роли пользователя.
 *             stream_hours: количество часов, которое пользователь пробыл на стримах.
 *             restore_complete: завершил ли пользователь переноску ролей.
 * @param { NodeModule } sqlite3 - Библиотека SQLite.
 * @param { String } dbPath - Путь к создаваемой/инициализируемой Базе Данных.
 * @returns {Database} - База данных, которая создаётся.
 */
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
            preferred_language TEXT NOT NULL,
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


/**
 * Добавляет пользователя в Базу Данных и присваевает ему стандартные значения столбцов:
 *             id: присваивается автоматически.
 *             discord_id: присваивается автоматически.
 *             telegram_id: -1
 *             preferred_language: RUS (Русский)
 *             roles: []
 *             stream_hours: 0
 *             restore_complete: false
 * @param { Database } db - Изменяемая База Данных
 * @param { String } userId - Айди пользователя для добавления в БД.
 * @returns {Promise<void>}
 */
async function addUser(db, userId) {
    const query = 'INSERT INTO users (discord_id, telegram_id, preferred_language, roles, stream_hours, restore_complete) VALUES (?, ?, ?, ?, ?, ?)';
    db.run(query, [userId, `-1`, `RUS`, `[]`, 0, false], function(err) {
        if (err) {
            console.error('Ошибка добавления данных пользователя:', err);
        } else {
            console.log('Данные пользователя успешно добавлены:', this.lastID);
        }
    });
}

/**
 * Получение всех данных пользователя, которые храняться в ДБ.
 * @param { Database } db - Изменяемая База Данных
 * @param { String } userId - Айди пользователя для получения из БД.
 * @callback
    * @param { Error } err - Ошибки, появляющиеся при Колбэке.
    * @param { Object } row - Строчка с данными пользователя.
 */
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

/**
 * Проверка зарегистрирован ли пользователь.
 * @param { Database } db - Изменяемая База Данных
 * @param { String } userId - Айди пользователя для проверки в БД.
 * @returns {Promise<boolean>} - Promise, разрешающийся true если пользователь зарегистрирован и false если нет
 */
async function checkReg(db, discordId) {
    return new Promise((resolve, reject) => {
        const query = 'SELECT COUNT(*) AS count FROM users WHERE discord_id = ?';

        db.get(query, [discordId], function (err, row) {
            if (err) {
                console.log(err);
                reject(err);
                return;
            }

            const userExists = row.count > 0;
            resolve(userExists);
        });
    });
}


/**
 * Функция для получения определённой ячейки таблицы.
 * @param { Database } db - Изменяемая База Данных.
 * @param { string } discordId - Айди пользователя в Discord для получения строки (по второму столбцу).
 * @param { string } column - Название столбца для возвращения данных.
 * @returns {Promise<String>} - Возвращаемое значение ячейки.
 */
async function getUserData(db, discordId, column) {
    const query = `SELECT ${column} FROM users WHERE discord_id = ?`;

    return new Promise((resolve, reject) => {
        db.get(query, [discordId], function(err, row) {
            if (err) {
                console.log(err);
                reject(err);
                return;
            }

            if (!row) {
                const errorMessage = `Пользователь с discord_id ${discordId} не найден`;
                console.log(new Error(errorMessage));
                reject(new Error(errorMessage));
                return;
            }

            const value = row[column];
            console.log(`Значение ${value} получено из столбца ${column} для пользователя с discord_id ${discordId}`);
            resolve(value);
        });
    });
}

/**
 * Обновление ячейки в Базе Данных.
 * @param { Database } db - Изменяемая База Данных.
 * @param { string } discordId - Айди пользователя в Discord для получения строки (по второму столбцу).
 * @param { string } column - Название столбца для изменения данных.
 * @param { string } value - Новое значение ячейки.
 * @returns {Promise<unknown>}
 */
async function updateData(db, discordId, column, value) {
    const query = `UPDATE users SET ${column} = ? WHERE discord_id = ?`;

    return new Promise((resolve, reject) => {
        db.run(query, [value, discordId], function(err) {
            if (err) {
                console.log(err);
                reject(err);
                return;
            }

            console.log(`Значение ${value} успешно записано в столбец ${column} для пользователя с discord_id ${discordId}`);
            resolve();
        });
    });
}



module.exports = {launch, addUser, getUser, getUserData, checkReg, updateData}