const express = require("express");
const dtEt = require("./dateTime");
const app = express();
const fs = require("fs");
const dbInfo = require("../../vp2024config");
const mysql = require("mysql2");
//paringu lahtiharutamiseks POST paringute puhul
const bodyparser = require("body-parser");
//failide uleslaadimine
const multer = require("multer");

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyparser.urlencoded({ extended: true }));
//seadistame multeri et folotd lahevad kindla katoloogi
const upload = multer({ dest: "./public/gallery/orig/" });

//loon andmedbaasi yhenduse
const conn = mysql.createConnection({
  host: dbInfo.configData.host,
  user: dbInfo.configData.user,
  password: dbInfo.configData.passWord,
  database: dbInfo.configData.dataBase,
});

app.get("/", (req, res) => {
  const semStartDate = new Date("2024-09-02");
  const today = new Date();
  const timeDifference = today - semStartDate;
  const dateDifference = Math.floor(timeDifference / (1000 * 3600 * 24));
  const sqlReq =
    "SELECT news_title, news_text, news_date FROM news ORDER BY news_date DESC LIMIT 1";
  conn.query(sqlReq, (err, sqlres) => {
    if (err) {
      throw err;
    } else {
      const latestNews = sqlres[0] || null;
      res.render("index.ejs", {
        dateDifference: dateDifference,
        latestNews: latestNews,
      });
    }
  });
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
      let persons = [];
      for (let i = 0; i < sqlres.length; i++) {
        persons.push({
          first_name: sqlres[i].first_name,
          last_name: sqlres[i].last_name,
          birth_date: dtEt.givenDateFormatted(sqlres[i].birth_date),
        });
      }
      res.render("tegelased", { persons: persons });
    }
  });
});
//res.render("tegelased");
//---------------------------------------------------------------------------------------------
app.get("/visitlogdb", (req, res) => {
  let sqlReq = "SELECT first_name, last_name, visit_time FROM visitlog";
  conn.query(sqlReq, (err, sqlres) => {
    if (err) {
      throw err;
    } else {
      res.render("visitlogdb", { visitlogs: sqlres });
    }
  });
});

app.post("/", (req, res) => {
  if (req.body.personSubmit) {
    let sqlReq = "INSERT INTO person (first_name, last_name) VALUES (?, ?)";
    conn.query(sqlReq, [req.body.first_name, req.body.last_name], (err) => {
      if (err) {
        throw err;
      } else {
        res.redirect("/eestifilm/tegelased");
      }
    });
  } else if (req.body.filmSubmit) {
  } else if (req.body.roleSubmit) {
  }
});
//-------------------------------------------------------------------------------------------------------------------
app.post("/eestifilm", (req, res) => {
  //<-------------------------/eestifilm
  if (req.body.personSubmit) {
    const sqlReq =
      "INSERT INTO film_person (first_name, last_name) VALUES (?, ?)";
    conn.query(sqlReq, [req.body.first_name, req.body.last_name], (err) => {
      if (err) {
        throw err;
      } else {
        res.redirect("/eestifilm");
      }
    });
  } else if (req.body.filmSubmit) {
    const sqlReq = "INSERT INTO films (film_title) VALUES (?)";
    conn.query(sqlReq, [req.body.film_name], (err) => {
      if (err) {
        throw err;
      } else {
        res.redirect("/eestifilm");
      }
    });
  } else if (req.body.roleSubmit) {
    const sqlReq = "INSERT INTO roles (role_name) VALUES (?)";
    conn.query(sqlReq, [req.body.role_name], (err) => {
      if (err) {
        throw err;
      } else {
        res.redirect("/eestifilm");
      }
    });
  }
});

app.get("/addnews", (req, res) => {
  const today = new Date();
  let expDate = today.setDate(today.getDate() + 10);
  expDate = new Date(expDate).toISOString();
  res.render("addnews", { expDate: expDate });
});

app.post("/addnews", (req, res) => {
  const { titleInput, newsInput, expireInput } = req.body;

  if (!titleInput || !newsInput || !expireInput) {
    return res.render("addnews", {
      error: "Kõik lahtrid peavad olemad täidetud!",
    });
  }

  if (titleInput.length < 3) {
    return res.render("addnews", {
      error: "Pealkiri peab sisaldama vähemalt 3 sümboli!",
    });
  }

  if (newsInput.length < 10) {
    return res.render("addnews", {
      error: "Uudise sisu peab sisaldama vähemalt 10 sümboli",
    });
  }

  const sqlReq =
    "INSERT INTO news (news_title, news_text, news_date, expire_date, user_id) VALUES (?, ?, NOW(), ?, ?)";

  conn.query(sqlReq, [titleInput, newsInput, expireInput, 1], (err) => {
    if (err) {
      throw err;
    } else {
      res.redirect("/news");
    }
  });
});
//res.render("/addnews");

app.get("/news", (req, res) => {
  let sqlReq =
    "SELECT news_title, news_text, news_date FROM news WHERE expire_date >= NOW() ORDER BY news_date DESC";
  conn.query(sqlReq, (err, sqlres) => {
    if (err) {
      throw err;
    } else {
      const latestNews = sqlres[0];
      res.render("news.ejs", { newsList: sqlres, latestNews: latestNews });
    }
  });
});

app.get("/photoupload", (req, res) => {
  res.render("photoupload");
});

app.post("/photoupload", upload.single("photoInput"), (req, res) => {
  console.log(req.body);
  console.log(req.file);
  res.render("photoupload");
});

app.listen(5117);
