/**
 * isLoggedIn
 *
 * A simple policy that allows any request from an authenticated user.
 *
 * For more about how this policy works and how to use it, see:
 *   http://sailsjs.com/anatomy/api/policies/isLoggedIn.js
 */
module.exports = function isLoggedIn(req, res, next) {

  // If `req.session.userId` is set, then we know that this request originated
  // from a logged-in user.  So we can safely proceed towards the relevant action.
  if (req.session.userId) {
    return next();
  }

  //--•
  // Otherwise, this request did not come from a logged-in user.
  if (!req.wantsJson) {
    return res.redirect('/login');
  }
  else {
    return res.forbidden();
  }

};
