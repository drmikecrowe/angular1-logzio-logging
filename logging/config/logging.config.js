'use strict';

angular.module('com.module.logging')
	.config([
		'$httpProvider',
		function ($httpProvider) {
			$httpProvider.interceptors.push('httpInterceptor');
		}])
;



