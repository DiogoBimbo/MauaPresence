const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const administradorSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    senha: {
        type: String,
        required: true
    }
  });

module.exports = mongoose.model('Adminstrador', administradorSchema);