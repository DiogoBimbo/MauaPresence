const mongoose = require("mongoose");
const URI = "mongodb+srv://Admin:A3yXuSj9zmbjbgra@clustermauapresence.kid9oyx.mongodb.net/";

mongoose
  .connect(URI)
  .then(() => console.log("DB is up!"))
  .catch(() => console.error());
