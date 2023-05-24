const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const session = require('express-session');
const flash = require('connect-flash');
const exphbs = require('express-handlebars');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require("cookie-parser")
const admin = require('./src/routes/admin.routes');
const aluno = require("./src/routes/aluno.routes");
const professor = require("./src/routes/professor.routes");
require('./database');

//Configs
  // Template Engine
  app.engine('handlebars', exphbs.engine({defaultLayout: 'main'}));
  app.set('view engine', 'handlebars');

   // Sessão
   app.use(session({
    secret: "curiosidade",
    resave: true,
    saveUninitialized: true
  }));
  app.use(flash());

  // Middlewares
  app.use((req, res, next) =>{
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    next();
  });
  app.use(morgan('dev'));
  app.use(express.json());  
  app.use(cors());
  app.use(bodyParser.urlencoded({extended: true}));
  app.use(bodyParser.json());
  app.use(cookieParser());

// Variables
app.set("port", 8000);

// Routes
app.use("/admin", admin);
app.use("/aluno", aluno);
app.use("/professor", professor);


app.listen(app.get("port"), () => {
  console.log(`WS escutando na porta ${app.get("port")}`);
});
