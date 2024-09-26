const express = require ("express");
const app = express();

app.get("/", (req, res)=>{
	res.send("express tootab");
});

app.listen(5118)