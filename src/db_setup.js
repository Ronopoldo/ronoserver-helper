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
            user_id TEXT NOT NULL,
            roles TEXT NOT NULL
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


function addUser(db, userId, userData) {
    const query = 'INSERT INTO users (user_id, roles) VALUES (?, ?)';
    db.run(query, [userId, JSON.stringify(userData)], function(err) {
        if (err) {
            console.error('Ошибка добавления данных пользователя:', err);
        } else {
            console.log('Данные пользователя успешно добавлены:', this.lastID);
        }
    });
}


function getUser(db, userId, callback) {
    const query = 'SELECT * FROM users WHERE user_id = ?';
    db.get(query, [userId], (err, row) => {
        if (err) {
            console.error('Ошибка получения данных пользователя:', err);
            callback(err);
        } else {
            callback(null, row);
        }
    });
}


module.exports = {launch, addUser, getUser}