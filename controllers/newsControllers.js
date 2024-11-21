const mysql = require("mysql2")
const dbInfo = require("../../../vp2024config")


const conn = mysql.createConnection({
    host: dbInfo.configData.host,
    user: dbInfo.configData.user,
    password: dbInfo.configData.passWord,
    database: dbInfo.configData.dataBase,
  });




//@desc home page for news section
//@route GET /news
//@access private 

const newsHome = (req, res) => {
    console.log('Render iz newsRoutes')
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
  };

//@desc page for adding news
//@route GET /news/addnews
//@access private 

const newsAdd = (req, res) => {
    const today = new Date();
    let expDate = today.setDate(today.getDate() + 10);
    expDate = new Date(expDate).toISOString();
    res.render("addnews", { expDate: expDate });
  };


//@desc adding news
//@route POST /news/addnews
//@access private 


const newsPOSTAdd = (req, res) => {
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
  };

  module.exports = {newsHome, newsAdd, newsPOSTAdd}
