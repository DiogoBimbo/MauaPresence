const mongoose = require("mongoose");
const URI = process.env.DATABASE_URI;

mongoose
  .connect(URI)
  .then(() => console.log("DB is up!"))
  .catch(() => console.error());
