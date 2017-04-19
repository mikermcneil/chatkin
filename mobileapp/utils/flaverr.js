/**
 * Module dependencies
 */

var _ = require('@sailshq/lodash');


/**
 * flaverr()
 *
 * A browser-compatible version of `flaverr`.
 * (See http://npmjs.com/package/flaverr for usage and more info.)
 */

module.exports = function flaverr (codeOrCustomizations, err){
  if (!_.isError(err)) {
    throw new Error('Consistency violation: Unexpected usage of `flaverr()`.  Expected 2nd argument to be an Error instance (but instead got `'+err+'`)');
  }

  if (_.isString(codeOrCustomizations)) {
    err.code = codeOrCustomizations;
  }
  else if (_.isObject(codeOrCustomizations) && !_.isArray(codeOrCustomizations) && !_.isFunction(codeOrCustomizations)) {
    if (codeOrCustomizations.stack) { throw new Error('Consistency violation: Unexpected usage of `flaverr()`.  Customizations (dictionary provided as 1st arg) are not allowed to contain a `stack`.'); }
    _.extend(err, codeOrCustomizations);
  }
  else {
    throw new Error('Consistency violation: Unexpected usage of `flaverr()`.  Expected 1st argument to be either a string error code or a dictionary of customizations (but instead got `'+codeOrCustomizations+'`)');
  }

  return err;
};
