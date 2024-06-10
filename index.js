//  Ronoserver Helper [ORIGIN NAME] – 10 jun 2024 17:28 (MSK GMT+3)

// Библиотеки, файлы, модули
const env = require('dotenv').config();
const fs = require('fs')
const { Client, GatewayIntentBits, ActivityType  } = require('discord.js');
const config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));


// Глобальные переменные
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
const tokenDiscord = process.env.DISCORD_TOKEN;
const { activity } = config;

// Подтверждение авторизации
client.once('ready', () => {
    console.log(`АВТОРИЗОВАНО КАК ${client.user.tag}!`);
    client.user.setActivity(activity.name, {type: ActivityType[activity.type]});
    console.log(`АКТИВНОСТЬ УСТАНОВЛЕНА`);
});


// Авторизация
client.login(tokenDiscord);