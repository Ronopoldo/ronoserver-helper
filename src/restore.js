/**
 * Поиск в Базе Данных всех ролей пользователя (вызывающего команду) и преобразование их из ID в названия с цветовыми кодами.
 * @param { Object } msg - Исходное сообщение пользователя.
 * @param { function } throwErr - Обработчик ошибок.
 * @param { function } replyLargeMessage - Функция для отправки сообщения превышающего лимит Discord.
 * @param { Object } LRSroles - База данных с legacy ролями.
 * @param { Object } LRSmembers - База данных с legacy пользователями.
 * @returns {Promise<Array>} - Список всех найденных legacy ролей пользователя с цветовыми кодами.\
 * Каждый элемент массива: <НАЗВАНИЕ:[c/ЦВЕТ]>.
 */
async function getRoles(msg, throwErr, replyLargeMessage, LRSroles, LRSmembers) {

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
    blackListed = [
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
        throwErr(msg, err);
    }

    console.log(`Закончен сбор ролей пользователя`);

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
            msg.reply(`Не нашёл тебя в базе данных пользователей :(`).catch(err => throwErr(msg, err));
            return [];
        }
    } catch (err) {
        throwErr(msg, err);
    }

    let isOutExist = namesArr.some(() => true); // Нашлись ли уникальные роли?
    console.log(`Закончено преобразование ролей в текст`);

    /**
     * Вывод сообщения и формирование промиса.
     */
    if (isOutExist) {
        msg.reply(`Что-то нашёл! Найденные роли:`);
        replyLargeMessage(msg, namesArr.toString()).catch(err => throwErr(msg, err, [isFound, namesArr.toString(), rolesID.toString()]));
    } else {
        msg.reply(`Уфф... Похоже, что никаких необычных ролей у Вас не было...`).catch(err => throwErr(msg, err, [isFound, namesArr.toString(), rolesID.toString()]));
    }

    return namesArr;
}

module.exports = {getRoles}