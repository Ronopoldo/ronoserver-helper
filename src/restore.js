/**
 * Поиск в Базе Данных пользователя и его ролей. Преобразует роли в формат <НАЗВАНИЕ:[c/ЦВЕТ]> и заносит из в Базу Данных.\
 * Также считает количество часов на стримах и заносит их тоже.
 * @param { Object } msg - Исходное сообщение пользователя.
 * @param { Object } core - Функции ядра.
 * @param { Object } replies - Пак с ответами пользователю на его языке.
 * @param { Object } LRSroles - База данных с legacy ролями.
 * @param { Object } LRSmembers - База данных с legacy пользователями.
 * @param { Database } db - База данных пользователей.
 * @param { function } updateData - Функция обновления базы данных (для записи).
 * @returns {Promise<Array>} - Массив из двух элементов: [0]: Список всех найденных legacy ролей пользователя с цветовыми кодами.\
 * Каждый элемент массива: <НАЗВАНИЕ:[c/ЦВЕТ]>.
 * [1]: Количество стримов на стримах
 */
const {updateData} = require("./db_setup");

function getRoles(msg, core, replies, LRSroles, LRSmembers, db, updateData) {

    /**
     * Конвертирует десятичное число в шестнадцатеричное значение.
     * @param {number} decimal - Десятичное число, которое нужно конвертировать.
     * @returns {string} Шестнадцатеричное значение в формате `#RRGGBB`.
     */
    function decimalToHex(decimal) {
        let hex = decimal.toString(16).toUpperCase();
        while (hex.length < 6) {
            hex = `0` + hex;
        }
        return `#` + hex;
    }

    // Роли, которые игнорируются при выводе.
    let blackListed = [
        `828652142163394560`,
        `828649202976030792`,
        `828650255737815060`,
        `828650358384885761`,
        `828650430497423452`,
        `911541808671096873`,
        `911542176981327872`,
        `911541543842746369`,
        `911542292169498624`,
        `911541977856745492`
    ]

    // Сколько часов стрима даёт каждая из ролей
    let streamRoles = {
        "719437151959384155": 2,
        "681307173976145920": 10,
        "701558179061825646": 20,
        "706656933121097749": 30,
        "909231209190662186": 60

    }


    researchID = msg.author.id;
    rolesID = [];

    /**
     * Составляем массив данных ролей пользователя
     * @param { object } rolesID - объект с информацией о пользователях
     * @returns { array } - массив с ID ролей пользователя
     */
    try {
        LRSmembers.forEach(member => {
            if (member.userId === researchID) {
                rolesID.push(...member.roles);

                // Удаляем элемент с айди сервера если он есть (роль @everyone)
                const index = rolesID.indexOf(`544902879534907392`);
                if (index !== -1) {
                    rolesID.splice(index, 1);
                    console.log(`Удалён элемент сервера (роль @everyone)`);
                }
            }
        });
    } catch (err) {
        core.throwErr(msg, err);
    }

    console.log(`Закончен сбор ролей пользователя`);


    /**
     * Считаем количество часов стримов пользователя
     */
    let streamFound = []
    rolesID.forEach(role => {
        if (Object.keys(streamRoles).includes(role)) {
            streamFound.push(streamRoles[role]);
        }
    })

    let streamHours = Math.max.apply(Math, streamFound)

    if (streamHours < 0) {
        streamHours = 0;
    }




    let isFound = rolesID.some(() => true); // Нашлись ли роли и/или пользователь?
    let namesArr = [];

    /**
     * Преобразование ролей из ID в формат: <ИМЯ:[c/ЦВЕТ]> и соответствующий занос их в массив namesArr
     */
    try {
        if (isFound) {
            LRSroles.forEach(role => {
                if ((rolesID.includes(role.id)) && !(blackListed.includes(role.id))) {
                    namesArr.push(`${role.name}:[c/${decimalToHex(role.color)}]`);
                }
            });
        } else {
            msg.reply(replies.restore.not_in_db).catch(err => core.throwErr(msg, err));
            return [];
        }
    } catch (err) {
        core.throwErr(msg, err);
    }

    let isOutExist = namesArr.some(() => true); // Нашлись ли уникальные роли?
    console.log(`Закончено преобразование ролей в текст`);

    /**
     * Вывод сообщения и формирование промиса. Занос данных в базу данных.
     */
    if (isOutExist) {
        msg.reply(replies.restore.roles_found);
        core.replyLargeMessage(msg, namesArr.toString()).catch(err => core.throwErr(msg, err, [isFound, namesArr.toString(), rolesID.toString()])).then(promise => {
            msg.reply(core.literalsParse(replies.restore.stream_counted, {streamHours: streamHours})).then(promise => {

                /**
                 * Занос ролей в БД
                 */
                updateData(db, researchID, 'roles', namesArr.toString())
                    .then(() => {
                        msg.reply(replies.restore.roles_added_to_db);
                    })
                    .catch(err => {
                        core.throwErr(msg, err);
                    });

                /**
                 * Занос часов стрима в БД
                 */
                updateData(db, researchID, 'stream_hours', streamHours)
                    .then(() => {
                        msg.reply(replies.restore.hours_added_to_db);
                    })
                    .catch(err => {
                        core.throwErr(msg, err);
                    });

                /**
                 * Занос запрета на использование /transfer в БД
                 */
                updateData(db, researchID, 'restore_complete', true)
                    .then(() => {
                    })
                    .catch(err => {
                        core.throwErr(msg, err);
                    });
            })
        });
    } else {
        msg.reply(replies.restore.no_uniq).catch(err => core.throwErr(msg, err, [isFound, namesArr.toString(), rolesID.toString()]));
    }


    return [namesArr, streamHours];
}

module.exports = {getRoles}