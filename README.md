# chatkin3

A location-based chat application built on [Sails](http://sailsjs.com) and [Vue.js](https://vuejs.org/).

Augments content using the [OpenWeatherMap](http://openweathermap.org/) and [Twitter](https://dev.twitter.com/) APIs.

### Compatibility

The production config checked in (`config/env/production.js`) assumes [MySQL](https://www.mysql.com/), but you could use any database supported by Waterline.

Tested with:
+ sails-disk
+ sails-mysql
+ sails-postgresql
+ sails-mongo


### Scheduled jobs

The scheduled jobs for this app live in the `scripts/` directory.  In our example deployment, we're using [Heroku Scheduler](https://devcenter.heroku.com/articles/scheduler) as our cron service.


### Links

+ [Sails framework documentation](https://sailsjs.com/documentation)
+ [Version notes / upgrading](https://sailsjs.com/documentation/upgrading/to-v-1-0)
+ [Deployment tips](https://sailsjs.com/documentation/concepts/deployment)
+ [Community support options](https://sailsjs.com/support)
+ [Professional / enterprise options](https://sailsjs.com/studio)


## License

This application, like the Sails framework, is available under the MIT license.
