var express = require('express'), 
http = require('http'),
bodyParser   = require('body-parser'),
cors = require('cors');

var app = express();

app.set('port', process.env.PORT || 7002);

app.use(bodyParser.json());
app.use(cors({
	'allowedHeaders': ['sessionId', 'Content-Type'],
	'exposedHeaders': ['sessionId'],
	'origin': '*',
	'methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
	'preflightContinue': false
}));
app.use(bodyParser.urlencoded({
	extended:true
}));

function log(message, type = 'log') {
	const date = new Date();
	const day = date.getDate();
	const month = date.getMonth() + 1;
	const year = date.getFullYear();
	const hour = date.getHours();
	const mins = date.getMinutes();
	const secs = date.getSeconds();
	const time = `${day}/${month}/${year} ${hour}:${mins}:${secs}`;
	let postfix = '';

	if (type === 'Error') {
		postfix = ' Error';
	}

	const finalMessage = `[${time}] Chinterface${postfix}:`;

	if (type === 'Error') {
		console.error(finalMessage, message);
	} else {
		console.log(finalMessage, message);
	}
}

app.post('/',function(request,response,next){
   log(request.body);
});


http.createServer(app).listen(app.get('port'), function(){
 console.log('Express server listening on port ' + app.get('port'));
})