const express = require("express");
const dtEt = require("./dateTime");
const app = express();
const fs = require("fs");
const dbInfo = require("../../vp2024config");
const mysql = require("mysql2");
//paringu lahtiharutamiseks POST paringute puhul
const bodyparser = require("body-parser");

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyparser.urlencoded({ extended: false }));

//loon andmedbaasi yhenduse
const conn = mysql.createConnection({
  host: dbInfo.configData.host,
  user: dbInfo.configData.user,
  password: dbInfo.configData.passWord,
  database: dbInfo.configData.dataBase,
});

app.get("/", (req, res) => {
  //res.send("express tootab");
  res.render("index.ejs");
});

app.get("/timenow", (req, res) => {
  const weekdayNow = dtEt.weekDayET();
  const dateNow = dtEt.dateEt();
  const timeNow = dtEt.timeEt();
  res.render("timenow", { nowWD: weekdayNow, nowD: dateNow, nowT: timeNow });
});

app.get("/vanasonad", (req, res) => {
  let folkWisdom = [];
  fs.readFile("public/textfiles/vanasonad.txt", "utf8", (err, data) => {
    if (err) {
      //throw err;
      res.render("justlist", {
        h2: "Vanasonad",
        listData: ["Ei leidnud uhtegi vanasona!"],
      });
    } else {
      folkWisdom = data.split(";");
      res.render("justlist", { h2: "Vanasonad", listData: folkWisdom });
    }
  });
});

app.get("/regvisit", (req, res) => {
  res.render("regvisit");
});

app.get("/visitlog", (req, res) => {
  fs.readFile("public/textfiles/visitlog.txt", "utf8", (err, data) => {
    if (err) {
      res.render("justlist", {
        h2: "Kylastuste logid",
        listData: ["Ei leidnud yhtegi kylastust!"],
      });
    } else {
      const visitLog = data
        .trim()
        .split("\n")
        .map((entry, index) => `${index + 1}. ${entry}`);
      res.render("justlist", { h2: "Kylastuste logid", listData: visitLog });
    }
  });
});

app.post("/regvisit", (req, res) => {
  console.log(req.body);

  const firstName = req.body.firstNameInput;
  const lastName = req.body.lastNameInput;
  const dateTime = `${dtEt.dateEt()} ${dtEt.timeEt()}`;
  const logEntry = `${firstName} ${lastName}; ${dateTime}\n`;

  fs.open("public/textfiles/visitlog.txt", "a", (err, file) => {
    if (err) {
      throw err;
    } else {
      fs.appendFile("public/textfiles/visitlog.txt", logEntry, (err) => {
        if (err) {
          throw err;
        } else {
          console.log("log added to txt file");
          res.render("regvisit");
        }
      });
    }
  });
});

app.get("/regvisitdb", (req, res) => {
  let notice = "";
  let firstName = "";
  let lastName = "";
  res.render("regvisitdb", {
    notice: notice,
    firstName: firstName,
    lastName: lastName,
  });
});

app.post("/regvisitdb", (req, res) => {
  let notice = "";
  let firstName = "";
  let lastName = "";
  if (!req.body.firstNameInput || !req.body.lastNameInput) {
    firstName = req.body.firstNameInput;
    lastName = req.body.lastNameInput;
    notice = "Osa andmeid sisestamata!";
    res.render("regvisitdb", {
      notice: notice,
      firstName: firstName,
      lastName: lastName,
    });
  } else {
    let sqlreq = "INSERT INTO visitlog (first_name, last_name) VALUES (?,?)";
    conn.query(
      sqlreq,
      [req.body.firstNameInput, req.body.lastNameInput],
      (err, sqlres) => {
        if (err) {
          throw err;
        } else {
          notice = "Kylastus registreeritud!";
          res.render("regvisitdb", {
            notice: notice,
            firstName: firstName,
            lastName: lastName,
          });
        }
      }
    );
  }
});

app.get("/eestifilm", (req, res) => {
  res.render("filmindex");
});

app.get("/eestifilm/tegelased", (req, res) => {
  let sqlReq = "SELECT first_name, last_name, birth_date FROM person";
  conn.query(sqlReq, (err, sqlres) => {
    if (err) {
      throw err;
    } else {
      console.log(sqlres);
      res.render("tegelased", { persons: sqlres });
    }
  });
  //res.render("tegelased");
});

app.listen(5118);
