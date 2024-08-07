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
const database = require(`${src}/db_setup.js`); // Функции базы данных.
const unregistredMessage = `Уфф... Похоже, что ты не зарегестрирован, чтобы использовать эту команду. Сделай это при помощи /register`

// Пути к файлам локализации для всех языков.
const language_associations = {
    'RUS': JSON.parse(fs.readFileSync(`./localization/RUS.json`), `utf-8`),
    'ENG': JSON.parse(fs.readFileSync(`./localization/ENG.json`, 'utf-8'))
}


/**
 * Подтверждение авторизации
 */
client.once(`ready`, () => {
    console.log(`АВТОРИЗОВАНО КАК ${client.user.tag}!`);
    client.user.setActivity(activity.name, {type: ActivityType[activity.type]}); // Установка активности.
    console.log(`АКТИВНОСТЬ УСТАНОВЛЕНА`);
});


// Запуск БАЗЫ ДАННЫХ
const db = database.launch(sqlite3, `./testDB`);

// Вывод информации о Ronopoldo
require(`${src}/db_setup.js`).getUser(db, '648872681210511371', (err, user) => {
    if (err) {
        console.error(err);
    } else {
        console.log('Данные пользователя:', user);
    }
});

/**
 * Обработчик сообщений (команды и обычные).
 */
client.on(`messageCreate`, msg => {
    let isCommand = msg.content.startsWith(prefix); // Проверка на то, что сообщение – команда.
    if (isCommand) {
        let args = msg.content.split(/ +/);
        let iniciator = msg.author.id;
        let command = args[0].toLowerCase().substr(args[0].toLowerCase().indexOf(prefix) + 1); // Сама команда (без аргументов и префикса)
        console.log(`Команда: ${command}, аргументы: ${args}, исходное сообщение: ${msg.content}, дата создания: ${msg.createdAt}, Инициатор: ${iniciator}`);

        // Проверка в БД чтобы установить язык. Если пользователь не зареган, то берётся язык от пользователя default (русский)
        database.checkReg(db, iniciator).then(isExist => {
            if (isExist == true) {
                langIniciator = iniciator;
            } else {
                langIniciator = `default`;
            }

            // Берём язык из базы данных
            database.getUserData(db, langIniciator, 'preferred_language').then(language => {

                let replies = language_associations[language]; // Переменная со всеми репликами
                console.log(`ЯЗЫК ПОЛЬЗОВАТЕЛЯ: ${language}\nЯзык получен от ${langIniciator}`);

                switch (command) {
                    //Все case должны быть написаны с маленькой буквы.
                    case `test`:
                        // Тестовая команда для тестирования функций :)
                        require(`${src}/test.js`).test(msg);
                        break;

                    case `register`:
                        // Команда для регистрации пользователя.
                        database.checkReg(db, iniciator).then(exists => {
                            console.log(`LOAL: ${exists}`)
                            if (exists == false) {
                                database.addUser(db, iniciator).then(promise => {
                                    msg.reply(replies.registration_complete);
                                })
                            } else {
                                msg.reply(replies.already_registred)
                            }
                        });
                        break;

                    case `restore`:
                        // Команда для поиска ролей пользователя в legacy БД и вывода их пользователю с заносом в SQL.
                        database.checkReg(db, iniciator).then(exists => {
                            if (exists == true) {
                                if (database.getUserData(db, iniciator, 'restore_complete').then(done => {
                                    //Проверка того, переносил ли пользователь роли раньше
                                    if (done == false) {
                                        let [foundRoles, streamHours] = require(`${src}/restore.js`).getRoles(msg, core, replies, LRSroles, LRSmembers, db, database.updateData);
                                        console.log(foundRoles);
                                        console.log(`кол-во часов: ${streamHours}`)
                                    } else {
                                        msg.reply(replies.data_already_transfered)
                                    }
                                })) ;
                            } else {
                                msg.reply(unregistredMessage)
                            }
                        });
                        break;

                    case `language`:
                        // Команда для смены языка интерфейса
                        database.checkReg(db, iniciator).then(exists => {
                            if (exists == true) {
                                require(`${src}/change_language.js`).change(args, db, core, database, replies, msg, iniciator, language_associations)
                            } else {
                                msg.reply(unregistredMessage)
                            }
                        });
                        break;


                    default:
                        // Иная команда
                        msg.reply(replies.command_not_found).catch(err => core.throwErr(msg, err));
                }
            });
        });
    }

    if (msg.content == '$create_test_user'){
        if (msg.author.id == "648872681210511371") {
            database.addUser(db, 'default');
            msg.reply('Готово');
        }
    }

})


// Авторизация
client.login(tokenDiscord);