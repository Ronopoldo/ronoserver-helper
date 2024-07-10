/*
 Простые, но очень важные для работы всего проекта функции. То, что лежит здесь, используется во многих других функциях. \
 Удаление или изменение функций здесь может очень сильно сказаться на работоспособности проекта в целом. \
 Изменять очень аккуратно!
 */

const src = `./`; // Путь к скриптам.

/**
 * Обработчик ошибок и форматированный вывод их пользователю.
 * @param { Object } msg - Объект с сообщением пользователя (на него будет ответ).
 * @param { String } err - Код ошибки для вывода пользователю.
 * @param { any } [extra] - Любая дополнительная информация (опционально).
 * @returns {Promise<void>}
 */
async function throwErr(msg, err, extra = 'NONE...') {
    console.log(`ERR_${err}`);

    // Проверка экстра информации на длину (меньше 1024 симоволов)
    if (extra.toString().length > 1024) {
        extra = 'Too large to display...';
    }

    msg.reply(`UNEXPECTED ERROR :(\nError code: ${err}\nExtra information: ${extra.toString()}`);
}


/**
 * Функция для обработки больших сообщений и отправления их пользователю. Если сообщение короткое, \
 * то возвращает его обычным .reply методом. Если большое, то делит его на несколько маленьких сообщений.
 * @param { Object } msg - Объект с сообщением пользователя (на него будет ответ).
 * @param { String } content - Сообщение, которое требуется обработать.
 * @returns {Promise<void>}
 */
async function replyLargeMessage(msg, content) {
    // Проверяем длину сообщения
    if (content.length <= 2000) {
        await msg.reply(content);
        return;
    }

    // Разделяем сообщение на части
    const parts = [];
    while (content.length > 0) {
        parts.push(content.substring(0, 2000));
        content = content.substring(2000);
    }

    // Отправляем каждую часть сообщения
    for (const part of parts) {
        await msg.channel.send(part);
    }
}

/**
 * Функция для парсинга литералов в сообщении expression. Значения в expression указываются в двойных фигурных скобках. \
 * Например, {{value}}.
 * @param { String } expression - Оригинальное сообщение с литералами.
 * @param { Object } valueObj - Объект с литералами из expression и их значения.
 * @returns { String } - Преобразованная строка со вставленными значениями.
 */
function literalsParse(expression, valueObj) {
    const templateMatcher = /{{\s?([^{}\s]*)\s?}}/g;
    let text = expression.replace(templateMatcher, (substring, value, index) => {
        value = valueObj[value];
        return value;
    });
    return text
}

module.exports = {throwErr, replyLargeMessage, literalsParse}