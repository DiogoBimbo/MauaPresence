const express = require("express");
const app = express();
const morgan = require("morgan");
const cors = require('cors');
require('./database');

// middlewares
app.use(morgan("dev"));
app.use(express.json());
app.use(cors());

// variables
app.set("port", 8000);

// routes
//app.use(require('./src/routes/adm.routes'));

app.listen(app.get("port"), () => {
  console.log(`WS escutando na porta ${app.get("port")}`);
});

