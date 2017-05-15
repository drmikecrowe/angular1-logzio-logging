'use strict';

/**
 * Registers decorator for the exceptionHandler, to log all app exceptions remotely
 */
angular
	.module('com.module.logging')
	.config(['$provide',
		function ($provide) {
			var Logger = null;

			var throttle = {
				history: {}
			};

			/**
			 * Whether the logging should be skipped or not because there have been too many logged errors within the last window
			 *
			 * @return {bool}
			 */
			function shouldThrottle() {
				var currentDate           = new Date(),
					currentSeconds        = currentDate.getSeconds(),
					loggedExceptionsCount = 0;

				//Update logged list
				throttle.history[currentSeconds] = (currentSeconds in throttle.history) ? throttle.history[currentSeconds] + 1 : 1;

				//Check if we've had too many logged in exceptions within the current window
				for (var i = currentSeconds - Logger.getConfig('exception_logger_config').windowInSeconds + 1; i <= currentSeconds; i++) {
					if (i in throttle.history) {
						loggedExceptionsCount += throttle.history[i];
					}
				}
				return loggedExceptionsCount > Logger.getConfig('exception_logger_config').maxExceptionsPerWindow;
			}

			/* Add decorator to the provider */
			$provide.decorator('$exceptionHandler', [
				'$delegate', '$injector',
				function ($delegate, $injector) {

					//Pass decorator to the $exceptionHandler provider
					return function (exception, cause) {
						if (!Logger) {
							Logger = $injector.get('logzioFactory');
						}
						if (Logger.getConfig('enable_exception')) {
							if (!shouldThrottle()) {
								Logger.log('error', exception);
								return;
							} else {
								return;
							}
						}

						//Chain along
						$delegate(exception, cause);
					};

				}]);


		}]);



