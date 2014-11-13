var moment = require('moment'),
    joi = require('joi'),
    chalk = require('chalk'),
    fs = require('fs'),
    util = require('util'),
    async = require('async'),
    events = require('events'),

    env = process.env.NODE_ENV,
    prod = env ? (env.toLowerCase() === 'production') : false;

function Logger (opts) {
    opts = joi.object().keys({
        prod: joi.boolean().default(prod)
    }).validate(opts || {}).value;

    var logger = function () {
        if (logger.routes.length) {
            logger[logger.levels[0]].apply(logger, arguments);
        }
        return logger;
    };
    logger.opts = opts;
    logger.levels = [];
    logger.routes = [];
    logger.send = function(name) {
        var that = this;
        return function () {
            var opts = {
                args: arguments,
                name: name,
                time: new Date()
            };
            async.applyEach(this.routes, opts, function (er, re) {
                if (er) {
                    that.emit('error', {
                        error: er,
                        when: opts
                    });
                }
            });
            return this;
        }
    };
    logger.onError = function (fn) {
        this.on('error', fn);
        return this;
    }
    logger.use = function(fn) {
        this.routes.push(fn.bind(this));
        return this;
    };
    logger.add = function(name) {
        this.levels.push(name);
        this[name] = this.send(name);
        return this;
    };
    logger.prototype = Object.create(events.EventEmitter.prototype);
    logger.prototype = Object.create(someOther.prototype);
    return logger;
}

// module
module.exports = Logger().add('debug').add('info').add('warn').add('error')
    .use(stdout({
        colors: ['yellow', 'cyan', 'magenta', 'red']
    }));

module.exports('help?')
module.exports.custom = function (opts) {
    return Logger(opts);
}

// middleware
function stdout (opts) {
    opts = joi.object().keys({
        timestamp: joi.boolean().default(true),
        namePrepend: joi.boolean().default(true),
        colors: joi.array().includes(joi.string()).default([])
    }).validate(opts || {});
    if (opts.error) {
        console.log(chalk.red("You passed bad options into stdout jotting middleware"));
        throw opts.error;
    }
    opts = opts.value;
    return function (runOtps) {
        var color = opts.colors[this.levels.indexOf(runOtps.name)],
            name = runOtps.name.toUpperCase(),
            text;

        if (opts.namePrepend) {
            if (color) {
                name = '[' + chalk[color](name) + ']';
            } else {
                name = '[' + name + ']';
            }
        } else {
            name = '';
        }
        if (opts.timestamp) {
            timestamp = fDate(runOtps.time);
        } else {
            timestamp = '';
        }
        text = name + timestamp;
        for (var i = runOtps.args.length - 1; i >= 0; i--) {
            if (typeof runOtps.args[i] === 'object') {
                runOtps.args[i] = util.inspect(runOtps.args[i]);
            }
        };
        var logs = Array.prototype.slice.call(runOtps.args),
            logMessage = [text + logs[0]].concat(logs.slice(1));
        console.log.apply(console, logMessage);
    }
}
module.exports.stdout = stdout;
function fileOut (opts) {
    //
}

// utils
function fDate (time) {
    return '[' + moment(time).format('YYYYMMMDDTHH:mm:ss.SSSZ') + '] ';
}