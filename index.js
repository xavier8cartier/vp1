const express = require("express");
const dtEt = require("./dateTime");
const app = express();
const fs = require("fs");
//paringu lahtiharutamiseks POST paringute puhul
const bodyparser = require("body-parser");

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyparser.urlencoded({ extended: false }));

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

app.post("/regvisit", (req, res) => {
  console.log(req.body);
  fs.open("public/textfiles/visitlog.txt", "a", (err, file) => {
    if (err) {
      throw err;
    } else {
      fs.appendFile(
        "public/textfiles/visitlog.txt",
        req.body.firstNameInput + " " + req.body.lastNameInput + ";",
        (err) => {
          if (err) {
            throw err;
          } else {
            console.log("Faili kirjutati");
            res.render("regvisit");
          }
        }
      );
    }
  });
});
app.listen(5118);
