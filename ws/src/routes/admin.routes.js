const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Joi = require("joi");
const router = express.Router();

const Admin = require("../models/administrador");
const Curso = require("../models/curso");
const Materia = require("../models/materia");
const CursoMateria = require("../models/cursoMateria");
const Aluno = require("../models/aluno");
const Professor = require("../models/professor");
const Aula = require("../models/Aula");

router.get("/", async (req, res) => {
  res.render("admin/index");
});

// rota login usando jwt e bcrypt
router.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ error: "Email ou senha inválidos" });
    }
    const checaSenha = await bcrypt.compare(senha, admin.senha);
    if (!checaSenha) {
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

// rotas dos Cursos
router.get("/cursos", async (req, res) => {
  res.render("admin/cursos");
});

// rota do formulário para cadastro
router.get("/cursos/cadastrar", async (req, res) => {
  res.render("admin/cadastrar_cursos");
});

//rota que valida e cadastra o novo Curso
router.post("/cursos/novo", async (req, res) => {
  const novoCurso = {
    cod_curso: req.body.cod_curso.toUpperCase(),
    nome_curso: req.body.nome.toUpperCase(),
  };

  // Validação dos campos usando Joi
  const schema = Joi.object({
    cod_curso: Joi.string().required().messages({
      "any.required": "O campo código do curso é obrigatório",
      "string.empty": "Por favor, informe um valor para o código do curso",
    }),
    nome_curso: Joi.string().required().messages({
      "any.required": "O campo nome do curso é obrigatório",
      "string.empty": "Por favor, informe um valor para o nome do curso",
    }),
  });
  const { error } = schema.validate(novoCurso);
  if (error) {
    req.flash(
      "error_msg",
      "Erro ao cadastrar curso: " + error.details[0].message
    );
    res.redirect("/admin/cursos/cadastrar");
    return;
  }

  // Verifica se já existe algum curso cadastrado com o mesmo nome ou código
  const cursoExistente = await Curso.findOne({
    $or: [
      { cod_curso: novoCurso.cod_curso },
      { nome_curso: novoCurso.nome_curso },
    ],
  });

  if (cursoExistente) {
    if (cursoExistente.cod_curso === novoCurso.cod_curso) {
      req.flash("error_msg", "Já existe um curso cadastrado com este código");
    } else {
      req.flash("error_msg", "Já existe um curso cadastrado com este nome");
    }
    res.redirect("/admin/cursos/cadastrar");
    return;
  }

  new Curso(novoCurso)
    .save()
    .then(() => {
      req.flash("success_msg", "Curso cadastrado com sucesso");
      res.redirect("/admin/cursos");
    })
    .catch((err) => {
      req.flash("error_msg", "Erro ao cadastrar curso");
      res.redirect("/admin/cursos/cadastrar");
    });
});
// rotas das Matérias
router.get("/materias", async (req, res) => {
  res.send("Página de materias");
});

router.get("/alunos", async (req, res) => {
  res.send("Página de alunos");
});

router.get("/professores", async (req, res) => {
  res.send("Página de professores");
});

router.get("/aulas", async (req, res) => {
  res.send("Página de cursos");
});

// router.post("/cadastro", async (req, res) => {
//   try {
//     const { email, senha } = req.body;
//     const senhaSegura = await bcrypt.hash(senha, 10);
//     const admin = new Admin({ email, senha: senhaSegura });
//     await admin.save();
//     res.status(201).json(admin);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

module.exports = router;
