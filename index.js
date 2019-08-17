const mongoose = require('mongoose');
require('./config/db');

const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const router = require('./routes');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session); 
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const flash = require('connect-flash'); 
const createError = require('http-errors'); 
const passport = require('./config/passport');

require('dotenv').config({ path : 'variables.env' });

const app = express();

// validação com express validator //
app.use(expressValidator());

// habilitar bodyParser //
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));



// habilitar handlebars como view
app.engine('handlebars', 
  exphbs({
    defaultLayout: 'layout',
    helpers: require('./helpers/handlebars')
  })
);

app.set('view engine', 'handlebars');

// static files
app.use(express.static(path.join(__dirname, 'public')));

app.use(cookieParser());

app.use(session({
  secret: process.env.SECRETO,
  key: process.env.KEY,
  resave: false,
  saveUninitialized:false,
  store: new MongoStore({ mongooseConnection : mongoose.connection })
}));

// inicializar passport //
app.use(passport.initialize());
app.use(passport.session());

// alertas e flash msg //
app.use(flash());

// criar nosso middleware //
app.use((req, res, next) => {
  res.locals.mensajes = req.flash();
  next();
})

app.use('/', router());

// 404 //
app.use((req, res, next) => {
  next(createError(404, 'Página não encontrada'));
})

// administração dos erros //
app.use((error, req, res, next) => {
  res.locals.mensaje = error.message;
  const status = error.status || 500;
  res.locals.status = status;
  res.status(status);
  res.render('error')
})

// deixar q heroku desine o porto //
const host = '0.0.0.0';
const port = process.env.PORT;

app.listen(port, host, () => {
  console.log('O servidor está funcionando...');
})