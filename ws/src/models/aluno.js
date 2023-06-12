const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const alunoSchema = new Schema({
    ra: {
        type: String,
        required: true
    },
    nome_completo: {
        type: String,
        required: true
    },
    semestre: {
        type: Number,
        required: true
    },
    grupo: {
        type: String,
        required: true
    },
    turma: {
        type: String,
        required: true
    },
    lab: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    senha: {
        type: String,
        required: true
    },
    id_curso: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Curso',
        required: true
    },
    resetToken: {
        type: String,
        default: null
      },
      resetTokenExpiration: {
        type: Date,
        default: null
      }
});

module.exports = mongoose.model('Aluno', alunoSchema);