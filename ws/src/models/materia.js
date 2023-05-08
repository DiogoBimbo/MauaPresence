const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const materiaSchema = new Schema({
    cod_materia: {
      type: String,
      required: true
    },
    nome_materia: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Materia', materiaSchema);