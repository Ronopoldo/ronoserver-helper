//  Ronoserver Helper [ORIGIN NAME] – 10 jun 2024 17:28 (MSK GMT+3)

// Библиотеки, файлы, модули
const env = require('dotenv').config();
const fs = require('fs');
const path = require('path');
const {Client, GatewayIntentBits, ActivityType} = require('discord.js');
const config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));


// Глобальные переменные
const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]});
const tokenDiscord = process.env.DISCORD_TOKEN;
const {activity, server, owner, prefix} = config;
const src = './src'

// Подтверждение авторизации
client.once('ready', () => {
    console.log(`АВТОРИЗОВАНО КАК ${client.user.tag}!`);
    client.user.setActivity(activity.name, {type: ActivityType[activity.type]});
    console.log(`АКТИВНОСТЬ УСТАНОВЛЕНА`);
});

client.on('messageCreate', msg => {
    let isCommand = msg.content.startsWith(prefix);

    if (isCommand) {
        let args = msg.content.split(/ +/);
        let command = args[0].toLowerCase().substr(args[0].toLowerCase().indexOf(prefix) + 1);
        console.log(`Команда: ${command}, аргументы: ${args}, исходное сообщение: ${msg.content}, дата создания: ${msg.createdAt}`);

        switch (command) {
            case 'test':
                require(`${src}/test.js`).test(msg);
        }
    }
})


// Авторизация
client.login(tokenDiscord);