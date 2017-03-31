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
    currentZone: { model: 'Zone' },

  },

  customToJSON: function (record){
    return _.omit(record, 'password');
  }

};

