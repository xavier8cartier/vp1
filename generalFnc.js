const checkLogin = function (req, res, next) {
    if (req.session != null) {
      if (req.session.userId) {
        console.log("Login, user:" + req.session.userId);
        next();
      } else {
        console.log("Login not detected");
        res.redirect("/signin");
      }
    } else {
      console.log("Session not detected");
      res.redirect("/signin");
    }
  };

  module.exports = {checkLogin}