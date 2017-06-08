/**
 * User.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: http://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    username: { type: 'string', unique: true, required: true, columnType: 'VARCHAR(255) CHARACTER SET utf8mb4' },
    password: { type: 'string', required: true },
    avatarColor: { type: 'string', required: true },
    remark: { type: 'string', columnType: 'LONGTEXT CHARACTER SET utf8mb4' },
    lastActiveAt: { type: 'number' },
    currentZone: { model: 'Zone' },
    authTokens: { collection: 'AuthToken', via: 'forUser' },
  },

  customToJSON: function (record){
    return _.omit(record, ['password', 'authTokens']);
  }

};

