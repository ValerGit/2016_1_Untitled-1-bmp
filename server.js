var express = require('express'),
    errorHandler = require('errorhandler'),
    dateFormat = require('dateformat'),
    app = express();
var proxy = require('http-proxy-middleware');

var HOSTNAME = 'localhost',
    PORT = 8081,
    PUBLIC_DIR = __dirname + '/' + (process.argv.length > 2 ? process.argv[2] : 'build-dev');

var reqCounter = 0;

app.use(function (req, res, done) {
	console.log('[%s] #%s [%s] %s',
              dateFormat(new Date, 'yyyy-mm-dd HH:mm:ss'),
              ++reqCounter,
              req.method,
              req.url
	);
	done();
});

var wsProxy = proxy(
  '/gameplay',
  {
    target: 'http://localhost:8080',
    ws: true
  }
);

var apiProxy = proxy(
  '/api/**/*',
  {
    target: 'http://localhost:8080'
  }
);

app
	.use('/', express.static(PUBLIC_DIR))
  .use(wsProxy)
  .use(apiProxy)
	.use(errorHandler());

app.listen(PORT, function () {
	console.log("Simple static server showing %s listening at http://%s:%s", PUBLIC_DIR, HOSTNAME, PORT);
});
