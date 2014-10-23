// depends
var // external
    moment = require('moment'),
    joi = require('joi'),
    chalk = require('chalk'),
    fs = require('fs'),
    util = require('util'),

    env = process.env.NODE_ENV,
    prod = env ? (env.toLowerCase() === 'production') : false;


var colors = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white', 'gray'],
    opt = joi.object().unknown(false).keys({
        logFile: joi.string().default('app.log'),
        devTime: joi.boolean().default(false),
        devLogFile: joi.boolean().default(false),
        prodLogLevel: joi.number().integer().min(1).max(4).default(2),
        colors: joi.object().default({
            debug: 'yellow',
            warn: 'magenta',
            info: 'cyan',
            error: 'red'
        }).keys({
            debug: joi.string().default('yellow').valid(colors),
            warn: joi.string().default('magenta').valid(colors),
            info: joi.string().default('cyan').valid(colors),
            error: joi.string().default('red').valid(colors)
        }),
        preText: joi.object().default({
            debug: 'debug',
            warn: 'warning',
            info: 'info',
            error: 'error'
        }).keys({
            debug: joi.string().default('debug'),
            warn: joi.string().default('warning'),
            info: joi.string().default('info'),
            error: joi.string().default('error')
        }),
        prod: joi.boolean().default(prod)
    });
/*
    levels = {
        debug: 1,
        info: 2,
        warn: 3,
        error: 4
    };
*/
////
// logger
////
module.exports = logger(opt.validate({}).value);
module.exports.custom = function (opts) {
    var valid = opt.validate(opts);
    if (valid.error) {
        console.log(chalk.red('You passed in bad options'));
        throw valid.error;
    }
    return logger(valid.value);
};

////
// util
////
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
function logger (op) {
    var l = function () {
        var date = fDate(),
            preText = op.preText.debug,
            color = op.colors.debug
        if (!op.prod) {
            sOut(op.colors.debug, op.preText.debug, op.devTime ? date : null)(arguments);
            if (op.devLogFile) {
                fOut(op.logFile, preText, date)(arguments);
            }
        } else if (op.prodLogLevel < 2) {
            sOut(op.colors.debug, op.preText.debug, date)(arguments);
            fOut(op.logFile, preText, date)(arguments);
        }
    };
    l.log = l.debug = l;
    l.info = function () {
        var color = op.colors.info,
            preText = op.preText.info,
            date = fDate();
        if (!op.prod) {
            sOut(color, preText, op.devTime ? date : null)(arguments);
            if (op.devLogFile) {
                fOut(op.logFile, preText, date)(arguments);
            }
        } else if (op.prodLogLevel < 3) {
            sOut(color, preText, date)(arguments);
            fOut(op.logFile, preText, date)(arguments);
        }
    };
    l.warn = function () {
        var color = op.colors.warn,
            preText = op.preText.warn,
            date = fDate();
        if (!op.prod) {
            sOut(color, preText, op.devTime ? date : null)(arguments);
            if (op.devLogFile) {
                fOut(op.logFile, preText, date)(arguments);
            }
        } else if (op.prodLogLevel < 4) {
            sOut(color, preText, date)(arguments);
            fOut(op.logFile, preText, date)(arguments);
        }
    };
    l.error = function () {
        var color = op.colors.error,
            preText = op.preText.error,
            date = fDate();
        if (!op.prod) {
            sOut(color, preText, op.devTime ? date : null)(arguments);
            if (op.devLogFile) {
                fOut(op.logFile, preText, date)(arguments);
            }
        } else {
            sOut(color, preText, date, true)(arguments);
            fOut(op.logFile, preText, date)(arguments);
        }
    };
    return l;
}
function fDate () {
    return '[' + moment().format('YYYYMMMDDTHH:mm:ss.SSSZ') + ']';
}