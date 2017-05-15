'use strict';

var app = angular.module('com.module.logging');

app.factory('httpInterceptor', [
	'$q', '$injector',
	function ($q, $injector) {
		var Logger = null;
		return {
			responseError: function (rejection) {
				if (rejection.status != -1) {
					if (!Logger) {
						Logger = $injector.get('logzioFactory');
					}
					if (Logger.getConfig('enable_xhr')) {
						Logger.log('warn', rejection);
					}
				}
				return $q.reject(rejection);
			}
		};
	}]);






