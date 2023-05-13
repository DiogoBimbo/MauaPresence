const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cursoSchema = new mongoose.Schema({
    cod_curso: {
      type: String,
      required: true
    },
    nome_curso: {
      type: String,
      required: true
    }
});

module.exports = mongoose.model('Curso', cursoSchema);