const alert = require('alert');
const axios = require('axios')
const express = require('express');
const path = require('path');
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth').OAuth2Strategy;
const api = require('./api');
const User = require('./db/user');
var domainUser = '';

User.createTable();

const app = express();

app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", req.header('origin'));
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	res.header("Access-Control-Allow-Credentials","true");
	next();
  }); 

passport.use(
	'pipedrive',
	new OAuth2Strategy({
			authorizationURL: 'https://oauth.pipedrive.com/oauth/authorize',
			tokenURL: 'https://oauth.pipedrive.com/oauth/token',
			clientID: '4193cb606f5e4903',
			clientSecret: 'cf526e0fc714e275298e147c7055ac8a5fb6aa2f',
			callbackURL: 'https://brdsoftclientjs.herokuapp.com/auth/pipedrive/callback' 
		}, async (accessToken, refreshToken, profile, done) => {
			const userInfo = await api.getUser(accessToken);
			axios.post('https://bdrsoftdummy.herokuapp.com/api/webhook', userInfo)
				.then((res) => {
					console.log(`statusCode: ${res.statusCode}`)
					console.log(res)
				})
				.catch((error) => {
					console.error(error)
			})
			// const user = await User.add(
			// 	userInfo.data.name,
			// 	accessToken,
			// 	refreshToken
			// );	
			done(null, { user });
		}
	)
);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());
app.use(async (req, res, next) => {
	req.user = await User.getById(1);
	next();
});

app.get('/auth/pipedrive', passport.authenticate('pipedrive'));
app.get('/auth/pipedrive/callback', passport.authenticate('pipedrive', {
	session: false,
	failureRedirect: '/',
	successRedirect: '/'
}));
app.get('/', async (req, res) => {
	if (req.user.length < 1) {
		return res.redirect('/auth/pipedrive');
	}
	try {
		console.log(domainUser);
		res.render('index', {
			name: req.user[0].username,
			url: 'https://' + domainUser + '.pipedrive.com'
		});
	} catch (error) {
		return res.send(error.message);
	}
});
app.get('/call', async (req, res) => {
	console.log(req.header('Referer'));
	res.redirect(req.header('Referer'));
});


app.listen(process.env.PORT || 3000, 
	() => console.log("Server is running..."));