'use strict';

/**
 * Registers decorator for the $log provider, to log all logs remotely
 */
angular
	.module('com.module.logging')
	.config([
		'$provide',
		function ($provide) {
			$provide.decorator('$log', function ($delegate, $injector) {
				var self   = this;
				var Logger;

				/**
				 * List of different log operations
				 * @type {string[]}
				 */
				var operations = [
					'log',
					'warn',
					'info',
					'error',
					'debug',
				];

				//Save the original log behavior
				var _logger = {
					log:   $delegate.log,
					warn:  $delegate.warn,
					info:  $delegate.info,
					error: $delegate.error,
					debug: $delegate.debug
				};

				/**
				 * Extend each $log operation
				 */
				operations.forEach(function (operation, index) {

					$delegate[operation] = function (message) {
						if (!Logger) {
							Logger = $injector.get('logzioFactory');
						}
						var enabled    = Logger.getConfig('log_logger_config');
						if (enabled.global && enabled[operation]) {
							Logger.log(operation, message);
						} else {
							if (console && console.log) {
								console.log(message);
							}
						}
					};

					// this keeps angular-mocks happy (https://groups.google.com/forum/#!topic/angular/DWOMe6c7L_Q)
					$delegate[operation].logs = [];
				});

				//Chain along
				return $delegate;

			});

		}]);



