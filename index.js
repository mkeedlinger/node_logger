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
    if (!(this instanceof Logger)) {
        return new Logger(opts);
    }

    // validates options
    opts = joi.object().keys({
        dev: joi.boolean().default(!prod)
    }).validate(opts || {}).value;

    var logger = function () {
        if (logger.levels.length) {
            logger[logger.levels[0]].apply(logger, arguments);
        }
        return logger;
    };
    logger.opts = opts;
    logger.levels = [];
    logger.routes = [];

    // gets prototype
    util._extend(logger, this);
    util._extend(logger, Logger.prototype);
    
    return logger;
}
Logger.prototype = events.EventEmitter.prototype;
Logger.constructor = Logger;

Logger.prototype.send = function(name) {
    var that = this;
    return function () {
        var opts = {
            args: arguments.length ? argsToArray(arguments) : [''],
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
        return that;
    }
};
Logger.prototype.use = function(fn) {
    this.routes.push(fn.bind(this));
    return this;
};
Logger.prototype.add = function(name) {
    if (Array.isArray(name)) {
        this.levels.concat(name);
        for (var i = name.length - 1; i >= 0; i--) {
            this[name[i]] = this.send(name[i]);
        }
        return this;
    }
    this.levels.push(name);
    this[name] = this.send(name);
    return this;
};

// module
module.exports = new Logger().add('debug').add('info').add('warn').add('error')
    .use(stdout({
        colors: ['cyan', 'blue', 'yellow', 'red']
    }));
module.exports.custom = function (opts) {
    return new Logger(opts);
}
module.exports.stdout = stdout;

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
            if (color && this.opts.dev) {
                name = '[' + chalk[color](name) + '] ';
            } else {
                name = '[' + name + '] ';
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
        }
        var logMessage = [text + runOtps.args[0]].concat(runOtps.args.slice(1));
        console.log.apply(console, logMessage);
    }
}
function fileOut (opts) {
    //
}

// utils
function fDate (time) {
    return '[' + moment(time).format('YYYYMMMDDTHH:mm:ss.SSSZ') + '] ';
}
function argsToArray (args) {
    return Array.prototype.slice.call(args);
}