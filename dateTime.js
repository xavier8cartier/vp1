const weekdayNamesEt = ["puhapaev", "esmaspaev", "teisipaev", "kolmapaev", "neljapaev", "reede", "laupaev"];
const monthNamesEt = ["jaanuar", "veebruar", "marts", "aprill", "mai", "juuni", "juuli", "august", "september", "oktoober", "november", "detsember"];

const dateEt = function(){
//function dateEt(){
	//const monthNamesEt = ["jaanuar", "veebruar", "mÃ¤rts", "aprill", "mai", "juuni", "juuli", "august", "september", "oktoober", "november", "detsember"];
	let timeNow = new Date();
	//console.log("Praegu on: " + timeNow);
	let dateNow = timeNow.getDate();
	let monthNow = timeNow.getMonth();
	let yearNow = timeNow.getFullYear();
	//const monthNamesEt = ["jaanuar", "veebruar", "marts", "aprill", "mai", "juuni", "juuli", "august", "september", "oktoober", "november", "detsember"];
	//console.log("Praegu on: " + dateNow + "." + (monthNow + 1) + "." + yearNow);
	//console.log("Praegu on: " + dateNow + ". " + monthNamesEt[monthNow] + " " + yearNow);
	//const monthNamesEt = ["jan", "veb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "det"]
	let dateNowEt = dateNow + ". " + monthNamesEt[monthNow] + " " + yearNow;
	return dateNowEt;
}
 const weekDayET = function(){
	let timeNow = new Date();
	let dayNow = timeNow.getDay();
	//const weekdayNamesEt = ["pÃ¼hapÃ¤ev", "esmaspÃ¤ev", "teisipÃ¤ev", "kolmapÃ¤ev", "neljapÃ¤ev", "reede", "laupÃ¤ev"];
	return weekdayNamesEt[dayNow];
}
 const timeFormattedET = function(){
	let timeNow = new Date();
	let hourNow = timeNow.getHours();
	let minuteNow = timeNow.getMinutes();
	let secondNow = timeNow.getSeconds();
	return hourNow + ":" + minuteNow + ":" + secondNow;
}

const partOfDay = function(){
	let dayPart = "suvaline hetk";
	let timeNow = new Date();
	if(timeNow.getHours >= 8 && timeNow.getHours() < 16){
		dayPart = "kooliaeg";
	}
	return dayPart;
}

module.exports = {monthsEt: monthNamesEt, weekdaysEt: weekdayNamesEt, dateEt: dateEt, weekDayET: weekDayET, timeEt: timeFormattedET};



