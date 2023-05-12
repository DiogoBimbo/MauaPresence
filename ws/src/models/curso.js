const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cursoSchema = new mongoose.Schema({
    cod_curso: {
      type: String
    },
    nome_curso: {
      type: String
    }
});

module.exports = mongoose.model('Curso', cursoSchema);