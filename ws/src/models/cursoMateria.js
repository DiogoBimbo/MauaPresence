const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cursoMateriaSchema = new mongoose.Schema({
    id_curso: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Curso',
        required: true
    },
    id_materia: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Materia',
        required: true
    }]
});

module.exports = mongoose.model('CursoMateria', cursoMateriaSchema);