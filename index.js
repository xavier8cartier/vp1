const express = require("express");
const dtEt = require("./dateTime");
const app = express();
const fs = require("fs");
const dbInfo = require("../../vp2024config");
const mysql = require("mysql2");
//paringu lahtiharutamiseks POST paringute puhul
const bodyparser = require("body-parser");
//failide uleslaadimine
const multer = require("multer"); //seadistame multeri et folotd lahevad kindla katoloogi
const session = require("express-session");
const bcrypt = require("bcrypt");
const sharp = require("sharp"); //pildimanipulatsiooniks
const upload = multer({ dest: "./public/gallery/orig/" }); //seadistame multeri et folotd lahevad kindla katoloogi

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyparser.urlencoded({ extended: true }));
app.use(session({ secret: "YobaBoba", saveUninitialized: true, resave: true }));

const conn = mysql.createConnection({
  //loon andmedbaasi yhenduse
  host: dbInfo.configData.host,
  user: dbInfo.configData.user,
  password: dbInfo.configData.passWord,
  database: dbInfo.configData.dataBase,
});

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

app.get("/home", checkLogin, (req, res) => {
  console.log("opa");
  res.render("home");
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  console.log("Valja logitud");
  res.redirect("/");
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
      let date = new Date(sqlres[0].news_date);
      date = date.toUTCString();
      res.render("index.ejs", {
        dateDifference: dateDifference,
        newsTitle: sqlres[0].news_title,
        newsDesc: sqlres[0].news_text,
        newsDate: date,
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

app.get("/eestifilm/tegelased", checkLogin, (req, res) => {
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

app.get("/signin", (req, res) => {
  res.render("signin");
});

app.post("/signin", async (req, res) => {
  let notice = "";
  const semStartDate = new Date("2024-09-02");
  const today = new Date();
  const timeDifference = today - semStartDate;
  const dateDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
  const sql = "SELECT * FROM news ORDER BY id DESC LIMIT 1";
  let sqlRes;
  conn.query(sql, [], (err, sqlRes) => {
    if (err) {
      notice = "ERR 500, proovi uuesti.";
      console.log("Login failed. err: br1");
      console.error(err);
      return res.status(500).render("signin", {
        dateDifference: dateDifference,
        newsTitle: sqlRes[0].title,
        newsDesc: sqlRes[0].text,
        newsDate: date,
        notice,
      });
    } else {
      let date = new Date(sqlRes[0].date);
      date = date.toUTCString();
      const { emailInput, passwordInput } = req.body;

      if (!emailInput || !passwordInput) {
        notice = "Moned andmeid puuduvad.";
        console.log("Login failed. err: br2");
        return res.status(400).render("signin", {
          dateDifference: dateDifference,
          newsTitle: sqlRes[0].news_title,
          newsDesc: sqlRes[0].news_text,
          newsDate: date,
          notice,
        });
      }

      conn.execute(
        "SELECT id, password FROM users WHERE email = ?",
        [emailInput],
        (err, result) => {
          if (err) {
            notice = "ERR 500, proovi uuesti.";
            console.log("Login failed. err: br3");
            console.error(err);
            return res.status(500).render("signin", {
              dateDifference: dateDifference,
              newsTitle: sqlRes[0].news_title,
              newsDesc: sqlRes[0].news_text,
              newsDate: date,
              notice,
            });
          } else {
            if (result[0] != null) {
              bcrypt.compare(
                passwordInput,
                result[0].password,
                (err, compRes) => {
                  if (err) {
                    notice = "Kasutajatunnus ja/voi parool on vale.";
                    console.log("Login failed. err: incorrect password");
                    return res.status(401).render("signin", {
                      dateDifference: dateDifference,
                      newsTitle: sqlRes[0].news_title,
                      newsDesc: sqlRes[0].news_text,
                      newsDate: date,
                      notice,
                    });
                  } else {
                    if (compRes === true) {
                      notice = "Olete sisse loginud!";
                      console.log(`Login successful for user ${emailInput}`);
                      req.session.userId = result[0].id;
                      return res.redirect("/home");
                    } else {
                      notice = "Kasutajatunnus ja/voi parool on vale.";
                      console.log("Login failed. err: incorrect password");
                      return res.status(401).render("signin", {
                        dateDifference: dateDifference,
                        newsTitle: sqlRes[0].news_title,
                        newsDesc: sqlRes[0].news_text,
                        newsDate: date,
                        notice,
                      });
                    }
                  }
                }
              );
            } else {
              notice = "Kasutajatunnus ja/voi parool on vale.";
              console.log("Login failed. err: incorrect email");
              return res.status(401).render("signin", {
                dateDifference: dateDifference,
                newsTitle: sqlRes[0].news_title,
                newsDesc: sqlRes[0].news_text,
                newsDate: date,
                notice,
              });
            }
          }
        }
      );
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

app.get("/addnews", checkLogin, (req, res) => {
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

app.get("/news", checkLogin, (req, res) => {
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
  //genereerime oma failinime
  const fileName = "vp_" + Date.now() + ".jpg";
  //nimetame uleslaetud failid umber

  if (!req.file) {
    return res.render("photoupload", {
      message: "Viga: Foto ei ole yleslaaditud!",
    });
  }

  try {
    const fileName = "vp_" + Date.now() + ".jpg";

    fs.rename(req.file.path, req.file.destination + fileName, (err) => {
      if (err) {
        throw err;
      }
      console.log(err);
    });

    sharp(req.file.destination + fileName)
      .resize(800, 600)
      .jpeg({ quality: 90 })
      .toFile("./public/gallery/normal/" + fileName);
    res.render("photoupload");
    //teeme 2 erisuurust
    sharp(req.file.destination + fileName)
      .resize(100, 100)
      .jpeg({ quality: 90 })
      .toFile("./public/gallery/thumb/" + fileName);
    //salvestame andmebaasi
    let sqlReq =
      "INSERT INTO photos (file_name, orig_name, alt_text, privacy, user_id) VALUES (?,?,?,?,?)";

    const userId = 1;
    conn.query(sqlReq, [
      fileName,
      req.file.originalname,
      req.body.altInput,
      req.body.privacyInput,
      userId,
      (err, result) => {
        if (err) {
          throw err;
        } else {
          res.render("photoupload", {
            message: "Foto yleslaaditud!",
          });
        }
      },
    ]);
  } catch (error) {
    console.error(error);
    res.render("photoupload", { message: "Viga foto yleslaadimisel!" });
  }
});

// näitab kõike avalikud fotod
app.get("/publicGallery", checkLogin, (req, res) => {
  const sqlReq = "SELECT * FROM photos WHERE privacy = 3 ORDER BY id DESC";
  conn.query(sqlReq, (err, sqlres) => {
    if (err) {
      throw err;
    } else {
      res.render("publicGallery", { photos: sqlres });
    }
  });
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post("/signup", (req, res) => {
  let notice = "Ootan andmeid";

  const {
    firstNameInput,
    lastNameInput,
    birthDateInput,
    genderInput,
    emailInput,
    passwordInput,
    confirmPasswordInput,
  } = req.body;

  if (
    !firstNameInput ||
    !lastNameInput ||
    !birthDateInput ||
    !genderInput ||
    !emailInput
  ) {
    notice = "Moned andmeid puuduvad.";
    console.log("Signup failed. err: br1");
    return res.status(400).render("signup", { notice });
  }

  if (!passwordInput || !confirmPasswordInput) {
    notice = "Salasona puudub.";
    console.log("Signup failed. err: br2");
    return res.status(400).render("signup", { notice });
  } else if (passwordInput.length < 8) {
    notice = "Salasona on liiga luhike";
    console.log("Signup failed. err: br3");
    return res.status(400).render("signup", { notice });
  } else if (passwordInput !== confirmPasswordInput) {
    notice = "Parooli ei kattu.";
    console.log("Signup failed. err: br4");
    return res.status(400).render("signup", { notice });
  }

  const emailQuery = conn.query(
    "SELECT * FROM users WHERE email = ?",
    [emailInput],
    (err, sql1res) => {
      if (!err) {
        if (sql1res.length > 0) {
          notice = "Kasutaja on juba olemas.";
          console.log("Signup failed. err: user_exists");
          return res.status(412).render("signup", { notice });
        }
      }
    }
  );

  bcrypt.genSalt(10, (err, salt) => {
    if (err) {
      notice = "ERR 500, proovi uuesti.";
      console.log("Signup failed. err: br5");
      console.error(err);
      return res.status(500).render("signup", { notice });
    } else {
      bcrypt.hash(passwordInput, salt, (err, encpwd) => {
        if (err) {
          notice = "ERR 500, proovi uuesti.";
          console.log("Signup failed. err: br6");
          console.error(err);
          return res.status(500).render("signup", { notice });
        } else {
          conn.execute(
            "INSERT INTO users (first_name, last_name, email, gender, birth_date, password) VALUES (?, ?, ?, ?, ?, ?)",
            [
              firstNameInput,
              lastNameInput,
              emailInput,
              genderInput,
              birthDateInput,
              encpwd,
            ],
            (err, sqlres) => {
              if (!err) {
                notice = `Kasutaja ${emailInput} on edukalt loodud!`;
                console.log("Signup OK");
                return res.status(201).render("signup", { notice });
              } else {
                notice = "ERR 500, proovi uuesti.";
                console.log("Signup failed. err: br7");
                console.error(err);
                return res.status(500).render("signup", { notice });
              }
            }
          );
        }
      });
    }
  });
});

app.listen(5117);
