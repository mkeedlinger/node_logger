// depends
var // external
    moment = require('moment'),
    // joi = require('joi'),
    chalk = require('chalk'),
    fs = require('fs'),
    util = require('util'),

    env = process.env.NODE_ENV ? process.env.NODE_ENV[0].toLowerCase() : 'd';

// var gOptions = joi.object().keys({
//         logFile: joi.string(),
//         timeStamp: joi.boolean(),
//         prodOnlyLogFile: joi.boolean()
//     });

logger = function () {
    if (env === 'd') {
        sOut('yellow', 'debug')(arguments);
    }
}
logger.log = logger;
logger.warn = function () {
    if (env === 'd') {
        sOut('magenta', 'warning')(arguments);
    } else if (env === 'p') {
        var date = moment().format('YYYYMMMDDTHH:mm:ss.SSSZ');
        sOut('red', 'warning', date)(arguments);
        fOut('app.log', 'warning', date)(arguments);
    }
}
logger.error = function () {
    if (env === 'd') {
        sOut('red', 'error', null, true)(arguments);
    } else if (env === 'p') {
        var date = moment().format('YYYYMMMDDTHH:mm:ss.SSSZ');
        sOut('red', 'error', date, true)(arguments);
        fOut('app.log', 'error', date)(arguments)
    }
}
logger.info = function () {
    if (env === 'd') {
        sOut('cyan', 'error')(arguments);
    } else if (env === 'p') {
        var date = moment().format('YYYYMMMDDTHH:mm:ss.SSSZ');
        sOut('cyan', 'info', date)(arguments);
        fOut('app.log', 'info', date)(arguments)
    }
}

function sOut (color, text, date, error) {
    text = (('[' + chalk[color](text.toUpperCase()) + '] ')) + (date ? date + ' ' : '');
    return function (arg) {
        var logs = Array.prototype.slice.call(arg),
            logMessage = [text + logs[0]].concat(logs.slice(1));
        console[error ? 'error' : 'log'].apply(console, logMessage);
    }
}
function fOut (path, text, date) {
    text = '[' + text.toUpperCase() + '] ' + (date ? date + ' ' : '');
    return function (arg) {
        var logs = Array.prototype.slice.call(arg),
            logMessage = [text + logs[0]].concat(logs.slice(1)).concat(['\n']);
        fs.appendFile(path, util.format.apply(util, logMessage), function(){});
    }
}
module.exports = logger;