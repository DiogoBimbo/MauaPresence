// talvez seja inútil
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const alunoMateriaSchema = new mongoose.Schema({
    id_aluno: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Aluno',
        required: true
    },
    id_materia: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Materia',
        required: true
    }
});

module.exports = mongoose.model('AlunoMateria', alunoMateriaSchema);