# angular1-logzio-logging
Angular 1 logging module supporing logz.io integration

# Introduction

This example module is a working module used in our application, but I haven't had time to "bowerize" it into a module.  Features:

* Uses [stacktrace.js](https://www.stacktracejs.com/) to parse .map files and report source errors
* `$log` messages are batch posted based on buffering
* Intercepts errors and reports as level:error messages

## Configuration

Enable the factory as follows:

    logzioFactory.setConfig({
        api_key:          '**YOUR_LOGZIO_TOKEN**',
        enable_xhr:       true,
        enable_exception: true,
        log_level:        'info',
        source_prefix:    '../../../client/app/',
    });

The above configuration:

* Publishes all `$log.info()` messages to logz.in
* All exceptions and xhr errors are reported
* script.map file references our source code at "../../../client/app" (this is build-system specific, so your mileage may vary)

To disable locally:

    logzioFactory.setConfig({
        log_level: 'off'
    });

This assumes you have some meta information for your application (a JSON object) that you wish to include in each log message (for searching).  Configure this meta information as follows (in your initialization routine):

    var meta = {
        role: 'angular'
    };
    if ($rootScope.currentUser) {
        meta.username = $rootScope.currentUser.username;
        meta.env      = $rootScope.currentUser.node_env;
    }
    logzioFactory.setConfig({
        baseMeta: meta
    });

## LICENSE:  MIT