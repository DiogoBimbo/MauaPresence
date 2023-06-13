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
    },
    resetToken: {
        type: String,
        default: null,
      },
      resetTokenExpiration: {
        type: Date,
        default: null,
      },
  });

module.exports = mongoose.model('Adminstrador', administradorSchema);