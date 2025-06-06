var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
const logger = require('./helpers/logging')
const knex = require('./data/db')
const {Model} = require('objection')
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

const promClient = require('prom-client');
// Create a Registry to register the metrics
const register = new promClient.Registry();
// Collect default metrics
promClient.collectDefaultMetrics({ register });

// Optional: create a custom metric
const httpRequests = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
});

logger.info('Connecting to database...')
Model.knex(knex)
var app = express();

// Expose metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(require('morgan')('combined', {'stream': logger.stream}))
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
