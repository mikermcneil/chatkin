/**
 * User.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: http://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    username: { type: 'string', unique: true, required: true },
    remark: { type: 'string' },
    currentZone: { model: 'Zone' },

  },

};

