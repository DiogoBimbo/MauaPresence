const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();

const Aula = require("../models/aula");
const Aluno = require("../models/aluno");
const AlunoMateria = require("../models/alunoMateria");

router.get("/login", (req, res) => {
  res.render("aluno/login");
});

router.get("/dashboard", async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    res.redirect("/aluno/login");
    return;
  }
  try {
    const decoded = jwt.verify(token, "chave_secreta");
    const aluno = await Aluno.findOne({ email: decoded.email });
    if (!aluno) {
      res.redirect("/aluno/login");
      return;
    }

    const alunoMateria = await AlunoMateria.findOne({ id_aluno: aluno._id }).lean();
    if (!alunoMateria) {
      // Nenhum registro de AlunoMateria encontrado
      res.render("aluno/dashboard", {
        aluno: {
          nome_completo: aluno.nome_completo,
          email: aluno.email,
          ra: aluno.ra,
          grupo: aluno.grupo,
          turma: aluno.turma,
          lab: aluno.lab,
        },
        aulas: [], // Não há aulas para exibir
      });
      return;
    }

    const idMaterias = alunoMateria.id_materia;

    const aulas = await Aula.find({ id_materia: { $in: idMaterias } })
      .populate("id_materia")
      .lean();

    res.render("aluno/dashboard", {
      aluno: {
        nome_completo: aluno.nome_completo,
        email: aluno.email,
        ra: aluno.ra,
        grupo: aluno.grupo,
        turma: aluno.turma,
        lab: aluno.lab,
      },
      aulas: aulas,
    });
  } catch (error) {
    console.error("Erro ao exibir o dashboard do aluno:", error);
    res.status(500).json({ message: "Erro ao exibir o dashboard do aluno" });
  }
});



router.post("/login", async (req, res) => {
  const { email, senha } = req.body;
  try {
    const aluno = await Aluno.findOne({ email });
    if (!aluno) {
      res.json({ success: false });
      return;
    }
    const senhaCorreta = await bcrypt.compare(senha, aluno.senha);
    if (senhaCorreta) {
      const token = jwt.sign({ email: aluno.email }, "chave_secreta");
      res.cookie("token", token);
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    res.json({ success: false });
  }
});

module.exports = router;
 