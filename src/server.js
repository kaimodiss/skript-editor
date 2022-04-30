const express         = require('express');
const compression     = require('compression')
const redirectToHTTPS = require('express-http-to-https').redirectToHTTPS
const helmet          = require('helmet')
const bodyParser      = require('body-parser')
const app             = express();
const tiny            = require('./utils/tiny.js');
const hbs             = require('hbs');
const ace             = require('./utils/ace')
const lzString        = require("./utils/lzstring")
const fs              = require("fs");
const path            = require("path");
const port            = process.env.port || 3040;

const files           = require("./routers/files")

const http = require('http').createServer(app);

let tinyURL = [];
let tinyURLfetch = [];

let shareURL = [];
let shareURLfetch = [];

hbs.registerPartials(__dirname + '/partials');
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, '/views'));

app.use(compression());
app.use(helmet());
app.use(express.static(path.join(__dirname, '/public')))

app.use(bodyParser.urlencoded({
	extended: true
}));

app.use("/lib", files)

app.get('/', (req, res) => res.render('index'));
app.get('/app', (req, res) => res.render('app'));

app.get(`/u/:code`, (req, res) => res.redirect(`/app#${tinyURLfetch[req.params.code]}`));
app.post('/shorturl', (req, res) => {
	let tim = tiny(6);
	while (tinyURL[tim]) {
		tim = tiny(6);
	}
	tinyURL.push(tim);
	tinyURLfetch[tim] = req.body.data;
	res.json({
		url: `u/${tim}`,
		data: req.body.data,
	});
});

app.post('/shareurl', (req, res) => {
	let tim = tiny(6);
	while (shareURL[tim]) {
		tim = tiny(6);
	}
	if (!allCode[tim]) allCode[tim] = new Document(lzString.decompressFromBase64(req.body.data));
	shareURL.push(tim);
	shareURLfetch[tim] = req.body.data
	res.json({
		url: `share#${tim}`,
		data: req.body.data,
	});
});

app.use((err, req, res, next) => {
	console.error(err.stack)
	res.status(500).send('Something broke!')
})

var listener = app.listen(port, () => console.log('Your app is listening on port ' + listener.address().port));

const io = require('socket.io').listen(listener);

Document = ace.Document
var allCode = [];

io.on('connection', socket => {
	socket.on('login', ({
		username,
		channel
	}) => {
		socket.username = username;
		socket.join(channel);
		socket.theChannel = channel;
		if (!allCode[socket.theChannel]) allCode[socket.theChannel] = new Document('');
		socket.to(channel).emit('JoinRoom', {
			username,
			channel
		});
		socket.emit('verified', allCode[socket.theChannel].getValue());
		socket.on('disconnect', () => {
			if (Object.keys(io.sockets.connected).length == 0) delete allCode[socket.theChannel];
			io.to(socket.theChannel).emit('userDisconnect', socket.username);
		});
		socket.on('change', ({
			delta,
			cursor,
			highlight
		}) => {
			allCode[socket.theChannel].applyDelta(delta);
			socket.to(socket.theChannel).emit('changeEvent', delta);
		});
	});
});
