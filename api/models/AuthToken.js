/**
 * AuthToken.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    value: { type: 'string', required: true, unique: true },
    forUser: { model: 'User', required: true }
  },

};

