const express = require("express");
const router = express.Router(); //Suur R on oluline

const {checkLogin} = require("../generalFnc");
const {newsHome, newsAdd, newsPOSTAdd} = require("../controllers/newsControllers")




router.get("/", checkLogin, newsHome);
router.get("/addnews", checkLogin, newsAdd);
router.post("/addnews", checkLogin, newsPOSTAdd);

module.exports = router