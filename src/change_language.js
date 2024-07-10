function change(args, db, core, database, replies, msg, iniciator, language_associations) {

    if (args.length < 2) {
        msg.reply(core.literalsParse(replies.change_language.no_args, {available_languages:Object.keys(language_associations)}));
        return
    }else {

        const language_given = args[1].toUpperCase()

        console.log(`Язык из аргумента: ${language_given}\nСписок языков: ${Object.keys(language_associations)}`)
        if (Object.keys(language_associations).includes(language_given)) {
            console.log('SUCCESS')
            database.updateData(db, iniciator, 'preferred_language', language_given);
            msg.reply(core.literalsParse(replies.change_language.success, {language: language_given}));
        } else {
            console.log('FAILED')
            msg.reply(core.literalsParse(replies.change_language.failed, {available_languages: Object.keys(language_associations)}));
        }
    }
}

module.exports = {change}