'use strict';

var app = angular.module('com.module.logging');

app.factory("logzioFactory", [
	'$http', '$timeout', '$window', 'lodash',
	function ($http, $timeout, $window, _) {
		var self       = this;
		self.buffering = false;
		self.buffer    = "";
		self.options   = {
			api_key:                 null,
			logzio_type:             "angular",
			exception_logger_config: {
				windowInSeconds:        5,
				maxExceptionsPerWindow: 4, //max # of exceptions we log in the window interval
			},
			omit: [
				'config.data.password'
			],
			enable_xhr:              false,
			enable_exception:        false,
			log_logger_config:       {
				global: false,
				warn:   true,
				error:  true,
				info:   true,
				log:    false,
				debug:  false
			},
			baseMeta:                {},
			delay_timing:            5000,
			source_prefix:           '',
		};

		/**
		 * constructor
		 */
		var logzioFactory = {
			getConfig: logzioGetConfig,
			setConfig: logzioSetConfig,
			log:       logzioLog
		};

		///////////

		function logzioGetConfig(key) {
			return self.options[key];
		}

		function logzioSetConfig(options) {
			angular.extend(self.options, options);
			if (options.log_level) {
				self.options.log_logger_config.debug = false;
				self.options.log_logger_config.log = false;
				self.options.log_logger_config.info = false;
				self.options.log_logger_config.error = false;
				self.options.log_logger_config.warn = false;
				self.options.log_logger_config.global = false;

				switch (options.log_level) {
					case 'debug':
						self.options.log_logger_config.debug = true;
					case 'log':
						self.options.log_logger_config.log = true;
					case 'info':
						self.options.log_logger_config.info = true;
					case 'error':
						self.options.log_logger_config.error = true;
					case 'warn':
						self.options.log_logger_config.warn = true;
					case 'global':
						self.options.log_logger_config.global = true;
				}
			}
			if (options.baseMeta) {
				self.options.baseMeta = options.baseMeta;
			}
		}

		function logzioLog(level, message) {
			try {
				if (!self.options.api_key) {
					return;
				}

				// Filter out some bad logs
				if (message.status == -1) return;
				if (typeof message == 'string' && message.length < 5) return;
				if (typeof message == 'object' && message.status == -1) return;

				if (message instanceof Error) {
					var errorMessage     = message.toString();
					var stringifiedStack = JSON.stringify(message.stack);
					if (typeof ErrorStackParser == 'object') {
						var frames = ErrorStackParser.parse(message);
						if ((typeof StackTraceGPS == 'function') && frames && frames.length > 0) {
							var gps      = new StackTraceGPS();
							var promises = [];
							frames.map(function (sf) {
								promises.push(gps.getMappedLocation(sf));
							});
							var counter  = 0;
							var sent     = false;
							var sendLog  = function () {
								if (sent) return;
								sent             = true;
								var sfMsg        = frames[0].toString().replace(self.options.source_prefix, '', 'g');
								stringifiedStack = frames.map(function (sf) {
									return sf.toString().replace(self.options.source_prefix, '', 'g');
								}).join('\n');
								var logmsg       = {message: errorMessage + ": " + sfMsg, stackTrace: stringifiedStack};
								createLog('error', logmsg);
							};
							promises.forEach(function (p, i) {
								p.then(function (v) { // add as fulfilled
									frames[i] = v;
									counter++; // notify the counter
									if (counter === promises.length) sendLog();
								}).catch(function (r) { // add as rejected
									counter++; // notify the counter
									if (counter === promises.length) sendLog();
								});
							});
						} else {
							if (message.status == -1) return;
							createLog('error', {message: errorMessage, stackTrace: stringifiedStack});
						}
					} else {
						createLog(level, {message: errorMessage, stackTrace: stringifiedStack});
					}
				} else {
					createLog(level, message);
				}
			} catch (ex) {
				if (window && window.console && typeof window.console.log == 'function') {
					//console.log("Failed to send log because of exception:\n", ex);
				}
			}
		}

		function createLog(level, message) {
			var parsedMsg                = typeof message == 'object' ? message : {message: message};
			var meta                     = {};
			angular.extend(meta, self.options.baseMeta);
			parsedMsg.url                = $window.location.href;
			parsedMsg.timestamp          = new Date();
			parsedMsg.meta               = meta;
			parsedMsg.level              = level;
			parsedMsg.type               = self.options.logzio_type;
			parsedMsg.metadata           = {
				'@timestamp': new Date().toJSON()
			};
			parsedMsg.meta['@timestamp'] = new Date().toJSON();
			_.each(self.options.omit, function(path) {
				var parts = path.split(".");
				var param = parts.pop();
				var obj = parts.join(".");
				_.set(parsedMsg, obj, _.omit(_.get(parsedMsg, obj), param));
			});
			bufferLog(_.omit(parsedMsg, self.options.omit));
		}

		function bufferLog(json) {
			self.buffer += JSON.stringify(json) + "\n";
			if (!self.buffering) {
				self.buffering = true;
				$timeout(function () {
					var buf = angular.copy(self.buffer);
					self.buffering = false;
					self.buffer    = "";
					sendBuffer(buf);
				}, self.options.delay_timing);
			}
		}

		function sendBuffer(buffer) {
			var logUrl = window.location.protocol + '//listener.logz.io:';
			logUrl += (window.location.protocol === 'http:' ? '8070' : '8071') + '?token=' + self.options.api_key + "&type=angular";
			var config = {
				headers:          {
					"Content-type": "text/plain"
				},
				ignoreLoadingBar: true
			};
			$http.post(logUrl, buffer, config)
				.then(function (data) {
				}, function (err) {
					//console.log('$http error: ', err);
				});
		}

		return logzioFactory;

	}]);
