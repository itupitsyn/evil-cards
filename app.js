const expressServer = require('./src/express.server');
const telepuzik = require('./src/telegram.bot');

expressServer.start();
telepuzik.start();
