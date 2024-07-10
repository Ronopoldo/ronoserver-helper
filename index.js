//  Ronoserver Helper [ORIGIN NAME] – 10 jun 2024 17:28 (MSK GMT+3)

// Библиотеки, файлы, модули
const env = require(`dotenv`).config();
const fs = require(`fs`);
const path = require(`path`);
const {Client, GatewayIntentBits, ActivityType} = require(`discord.js`);
const sqlite3 = require('sqlite3').verbose();

// JSON данные
const config = JSON.parse(fs.readFileSync(`./config.json`, `utf-8`)); // Файл конфигурации
const LRSroles = JSON.parse(fs.readFileSync(`./legacy-db/roles.json`, `utf-8`)); // БД с legacy ролями
const LRSmembers = JSON.parse(fs.readFileSync(`./legacy-db/members.json`, `utf-8`)); // БД с legacy пользователями


// Глобальные переменные
const dbPath = path.resolve(__dirname, 'user_data.db');
const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]});
const tokenDiscord = process.env.DISCORD_TOKEN;
const {activity, server, owner, prefix} = config; // Формирование объекта config.
const src = `./src` // Путь к скриптам.
const core = require(`${src}/core_functions.js`); // Функции ядра.


/**
 * Подтверждение авторизации
 */
client.once(`ready`, () => {
    console.log(`АВТОРИЗОВАНО КАК ${client.user.tag}!`);
    client.user.setActivity(activity.name, {type: ActivityType[activity.type]}); // Установка активности.
    console.log(`АКТИВНОСТЬ УСТАНОВЛЕНА`);
});


// Запуск БАЗЫ ДАННЫХ
const db = require(`${src}/db_setup.js`).launch(sqlite3, `./testDB`);

// const checkReg = require(`${src}/db_setup.js`).checkReg();

// require(`${src}/db_setup.js`).addUser(db, 'ronotester');
// require(`${src}/db_setup.js`).getUser(db, 'ronotester', (err, user) => {
//     if (err) {
//         console.error(err);
//     } else {
//         console.log('Данные пользователя:', user);
//     }
// });

/**
 * Обработчик сообщений (команды и обычные).
 */
client.on(`messageCreate`, msg => {
    let isCommand = msg.content.startsWith(prefix); // Проверка на то, что сообщение – команда.
    if (isCommand) {
        let args = msg.content.split(/ +/);
        let command = args[0].toLowerCase().substr(args[0].toLowerCase().indexOf(prefix) + 1); // Сама команда (без аргументов и префикса)
        console.log(`Команда: ${command}, аргументы: ${args}, исходное сообщение: ${msg.content}, дата создания: ${msg.createdAt}`);

        switch (command) {
            //Все case должны быть написаны с маленькой буквы.
            case `test`:
                // Тестовая команда для тестирования функций :)
                require(`${src}/test.js`).test(msg);
                break;

            case `register`:
                require(`${src}/db_setup.js`).checkReg(db, msg.author.id, (err, exists) => {
                    console.log(`СТАТУС РЕГИСТРАЦИИ: ${exists}`);

                    if (err){
                        core.throwErr(msg, err);
                        return
                    }

                    if (exists == false) {
                        require(`${src}/db_setup.js`).addUser(db, msg.author.id).then(promise => {
                            msg.reply(`Успешно зарегестрировал тебя! :3`);
                        })
                    } else {
                        msg.reply(`Уфф... Похоже, что ты уже зарегестрирован! Тебе не надо делать этого второй раз, в любом случае.. :)`)
                    }

                    return
                });


                break;

            case `restore`:
                // Команда для поиска ролей пользователя в legacy БД и вывода их пользователю. (в дальнейшем с заносом в SQL)
                let [foundRoles, streamHours] = require(`${src}/restore.js`).getRoles(msg, core.throwErr, core.replyLargeMessage, LRSroles, LRSmembers);
                console.log(foundRoles);
                console.log(`кол-во часов: ${streamHours}`)
                break;
            default:
                // Иная команда
                msg.reply(`Команда не найдена... Проверьте правильность ввода`).catch(err => core.throwErr(msg, err));
        }
    }
})


// Авторизация
client.login(tokenDiscord);