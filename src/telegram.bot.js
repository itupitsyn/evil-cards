const TelegramBot = require('node-telegram-bot-api');
const { generateCard, languages } = require('./creator');

require('dotenv').config();

function start() {
  // replace the value below with the Telegram token you receive from @BotFather
  const token = process.env.BOT_TOKEN;

  // Create a bot that uses 'polling' to fetch new updates
  const bot = new TelegramBot(token, { polling: true });

  bot.onText(/\/start/, async (msg) => {
    await bot.sendMessage(msg.chat.id, 'hello, toks');
    bot.sendMessage(msg.chat.id, 'use /try to try');
  });

  bot.onText(/\/try/, async (msg) => {
    const kb = languages().map((el) => [
      {
        text: el.full,
        callback_data: JSON.stringify({ lang: el.short }),
      },
    ]);
    bot.sendMessage(msg.chat.id, 'Choose language', {
      reply_markup: {
        inline_keyboard: kb,
      },
    });
  });

  bot.on('callback_query', async (q) => {
    let lang;
    const msg = q.message;
    const chatId = msg.chat.id;
    try {
      lang = JSON.parse(q.data).lang;
    } catch (err) {
      bot.sendMessage(chatId, 'Wrong query');
    }
    const waitMessage = await bot.sendMessage(chatId, 'wait...');
    const filename = await generateCard(lang);
    await bot.deleteMessage(waitMessage.chat.id, waitMessage.message_id);
    if (filename) {
      await bot.deleteMessage(q.message.chat.id, q.message.message_id);
      bot.sendVideo(chatId, filename);
    } else {
      bot.sendMessage(chatId, "Couldn't generate a postcard. Try again.");
    }
  });
}

module.exports = { start };
