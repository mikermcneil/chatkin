/**
 * fetch-and-cache.js
 *
 * @description :: Server-side helper function.
 * @help        :: See http://sailsjs.com/docs/concepts/helpers
 */
module.exports = {


  friendlyName: 'Fetch and cache',


  description: 'Fetch some data and update the cache-- or, if the data is already cached and isn\'t too stale, use the cached version instead.',


  inputs: {

    maxAge: {
      type: 'number',
      defaultsTo: 1000*60*60,
      description: 'The max number of miliseconds to cache this data.'
    },

    fetch: {
      type: 'ref',
      required: true,
      description: 'An asynchronous function (`->(<-(err, freshData))`) that fetches straight from the original source.'
    },

    readFromCache: {
      type: 'ref',
      required: true,
      description: 'An asynchronous function (`->(<-(err, { data: "===", lastCachedAt: 23813813592 }))`) that reads from the cache.'
    },

    writeToCache: {
      type: 'ref',
      required: true,
      description: 'An asynchronous function (`->(freshData, <-(err))`) that receives fresh data and writes it to the cache.'
    },

  },


  exits: {

    success: {
      outputDescription: 'A dictionary consisting of `data` (the data) and `isFresh` (a flag that is set to `true` if the cache was skipped bypassed this time).'
    }

  },


  fn: function (inputs, exits) {

    // Set up local variables for incoming lambda functions.
    // (This is just for clarity below.)
    var maxAge = inputs.maxAge;
    var handleFetch = inputs.fetch;
    var handleCacheRead = inputs.readFromCache;
    var handleCacheWrite = inputs.writeToCache;


    // TODO
    return exits.error(new Error('Not implemented yet'));

  }


};
