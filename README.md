# chatkin

A location-based chat application built on [Sails v1.0](http://sailsjs.com) and [Vue.js](https://vuejs.org/).

Augments content using the [OpenWeatherMap](http://openweathermap.org/) and [Twitter](https://dev.twitter.com/) APIs.

> ### WARNING: THIS IS CURRENTLY STILL A WORK IN PROGRESS!
>
> We're in the process of extending this example app to cover more ground.  But we decided to go ahead and open-source it so that any folks who are especially eager and who stumble across it will be able to start getting benefit from it today.
> 
> Sincerely,
> [@mikermcneil](https://github.com/mikermcneil) &amp; [@rachaelshaw](https://github.com/rachaelshaw)

![screenshot of zone chat](https://cloud.githubusercontent.com/assets/618009/24832727/aa58edb6-1c7b-11e7-9fe0-753748755399.png)
![screenshot of zone map](https://cloud.githubusercontent.com/assets/618009/24832737/d8a6355c-1c7b-11e7-8cd8-dd629eec37df.png)
![screenshot of login screen](https://cloud.githubusercontent.com/assets/618009/24832755/584032ae-1c7c-11e7-8267-0a593f096261.png)
![screenshot of zone weather](https://cloud.githubusercontent.com/assets/618009/24832742/0aa45700-1c7c-11e7-8d12-5347838c6595.png)


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
