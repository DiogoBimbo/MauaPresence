const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const router = express.Router();

const Admin = require('../models/admininistrador');
const Curso = require('../models/curso');
const Materia = require('../models/materia');
const CursoMateria = require('../models/cursoMateria');
const Aluno = require('../models/aluno');
const Professor = require('../models/Professor');
const Aula = require('../models/Aula');

router.get('/', async (req,res) => {
    res.send("Página principal do painel ADM")
});

// rota login usando jwt e bcrypt
router.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const admin = await Admin.findOne({ email });
      if (!admin) {
        return res.status(401).json({ error: "Email ou senha inválidos" });
      }
      const passwordCheck = await bcrypt.compare(password, admin.password);
      if (!passwordCheck) {
        return res.status(401).json({ error: "Email ou senha inválidos" });
      }
      const token = jwt.sign({ id: admin._id }, "chave secreta", {
        expiresIn: "1h",
      });
      res.json({ token });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

router.get('/cursos', async (req,res) => {
    res.send("Página de cursos")
});

router.get('/materias', async (req,res) => {
    res.send("Página de materias")
});

router.get('/cursoMaterias', async (req,res) => {
    res.send("Página de materias associadas à um curso")
});

router.get('/alunos', async (req,res) => {
    res.send("Página de alunos")
});

router.get('/professores', async (req,res) => {
    res.send("Página de professores")
});

router.get('/aulas', async (req,res) => {
    res.send("Página de cursos")
});

module.exports = router;