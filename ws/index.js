const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const handlebars = require('express-handlebars');
const app = express();
const bodyParser = require('body-parser');
const admin = require('./src/routes/admin.routes')
require('./database');

//Configs
  // Template Engine
  app.engine('handlebars',handlebars({defaultLayout: 'main'}));
  app.set('view engine', 'handlebars')

  // Middlewares
  app.use(morgan('dev'));
  app.use(express.json());  
  app.use(cors());
  app.use(bodyParser.urlencoded({extended: true}));
  app.use(bodyParser.json())

  //Public
  app.use(express.static(path.join(__dirname,'public')));

  // Variables
  app.set("port", 8000);

  // Routes
  app.use('/admin',admin);

  app.listen(app.get('port'), () => {
    console.log(`WS escutando na porta ${app.get("port")}`);
  });

