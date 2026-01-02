const isValidAuthToken = require('./isValidAuthToken');
const login = require('./login');
const logout = require('./logout');
// TODO: Migrate to Supabase Auth password reset
// const forgetPassword = require('./forgetPassword');
// const resetPassword = require('./resetPassword');

const createAuthMiddleware = (userModel) => {
  let authMethods = {};

  authMethods.isValidAuthToken = (req, res, next) =>
    isValidAuthToken(req, res, next, {
      userModel,
    });

  authMethods.login = (req, res) =>
    login(req, res, {
      userModel,
    });

  // TODO: Migrate to Supabase Auth password reset
  // authMethods.forgetPassword = (req, res) =>
  //   forgetPassword(req, res, {
  //     userModel,
  //   });

  // authMethods.resetPassword = (req, res) =>
  //   resetPassword(req, res, {
  //     userModel,
  //   });

  authMethods.logout = (req, res) =>
    logout(req, res, {
      userModel,
    });
  return authMethods;
};

module.exports = createAuthMiddleware;
