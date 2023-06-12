const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const aulaSchema = new mongoose.Schema({
    horario_inicio: {
        type: String,
        required: true
    },
    horario_fim: {
        type: String,
        required: true
    },
    tipo_aula: {
        type: String,
        enum: ['TEO', 'LAB']
    },
    enum_aula: {
        type: String,
        enum: ['Padrão','Pae']
    },
    id_materia: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Materia',
        required: true
    },
    id_professor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Professor',
        required: true
    },
    dia_semana: {
        type: String,
        required: true,
        enum: ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
    },
    sala: {
        type: String,
        required: true
    },
    grupo: {
        type: String,
        required: false
    },
    turma: {
        type: String,
        required: false
    },
    lab: {
        type: String,
        required: false
    }
});

module.exports = mongoose.model('Aula', aulaSchema);