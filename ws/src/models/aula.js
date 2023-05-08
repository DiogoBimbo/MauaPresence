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
        type: Number,
        required: true,
        min: 1,
        max: 7
    },
    sala: {
        type: String,
        required: true
    },
    gtl: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Aula', aulaSchema);