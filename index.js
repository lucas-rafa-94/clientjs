
const alert = require('alert');
const express = require('express');
const path = require('path');
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth').OAuth2Strategy;

const api = require('./api');
const config = require('./config');
const User = require('./db/user');

User.createTable();

const app = express();
const port = 3000;

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
			clientID: config.clientID || '',
			clientSecret: config.clientSecret || '',
			callbackURL: config.callbackURL || ''
		}, async (accessToken, refreshToken, profile, done) => {
			const userInfo = await api.getUser(accessToken);
			console.log(userInfo);
			console.log(accessToken);
			console.log(refreshToken);
			console.log(profile);
			const user = await User.add(
				userInfo.data.name,
				accessToken,
				refreshToken
			);
		    		
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
		const deals = await api.getDeals(req.user[0].access_token);
		res.render('deals', {
			name: req.user[0].username,
			deals: deals.data
		});
	} catch (error) {
		return res.send(error.message);
	}
});
app.get('/call', async (req, res) => {
	// console.log(req)
	console.log(req.get('Referrer'))
	console.log(req.get('origin'))
	alert('teste');
	res.redirect('https://brasildenenvolvimentodesoftwares-sandbox.pipedrive.com/deal/9');
	// res.end();
});


app.listen(port, () => console.log(`App listening on port ${port}`));