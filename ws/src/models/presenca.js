const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const presencaSchema = new mongoose.Schema({
  data: {
    type: Date,
    default: Date.now,
    required: true,
  }, 
  id_aula: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Aula',
    required: true,
  },
  id_aluno: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Aluno',
    required: true,
  }],
  status: [{
    type: String,
    enum: ['presente', 'faltou'],
    default: 'faltou',
  }],
  codigo: {
    type: String,
    required: false,
  },
});

module.exports = mongoose.model('Presenca', presencaSchema);
