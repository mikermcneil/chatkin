/**
 * User.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: http://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    username: { type: 'string', unique: true, required: true },
    password: { type: 'string', required: true },
    avatarColor: { type: 'string', required: true },
    remark: { type: 'string' },
    lastActiveAt: { type: 'number' },
    currentZone: { model: 'Zone' },
    authTokens: { collection: 'AuthToken', via: 'forUser' },
  },

  customToJSON: function (record){
    return _.omit(record, ['password', 'authTokens']);
  }

};

