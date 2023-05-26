const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();
const Aula = require("../models/aula");
const Aluno = require("../models/aluno");
const AlunoMateria = require("../models/alunoMateria");
const aluno = require("../models/aluno");
const Presenca = require("../models/presenca");

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
    const alunoMateria = await AlunoMateria.findOne({
      id_aluno: aluno._id,
    }).lean();
    if (!alunoMateria) {
      res.render("aluno/dashboard", {
        aluno: {
          nome_completo: aluno.nome_completo,
          email: aluno.email,
          ra: aluno.ra,
          grupo: aluno.grupo,
          turma: aluno.turma,
          lab: aluno.lab,
        },
        aulas: [],
      });
      return;
    }
    const idMaterias = alunoMateria.id_materia;
    const diasSemana = [
      "Domingo",
      "Segunda-feira",
      "Terça-feira",
      "Quarta-feira",
      "Quinta-feira",
      "Sexta-feira",
      "Sábado",
    ];
    const hoje = new Date().getUTCDay();
    const diaAtual = diasSemana[hoje];
    const aulas = await Aula.find({
      id_materia: { $in: idMaterias },
      dia_semana: diaAtual,
    })
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

router.post("/marcar-presenca/:aulaId", async (req, res) => {
  const { aulaId } = req.params;
  const { codigo } = req.body;

  try {
    const aula = await Aula.findById(aulaId);
    if (!aula) {
      res.status(404).json({ message: "Aula não encontrada" });
      return;
    }

    const token = req.cookies.token;
    if (!token) {
      res.status(401).json({ message: "Token não fornecido" });
      return;
    }

    const decoded = jwt.verify(token, "chave_secreta");
    const aluno = await Aluno.findOne({ email: decoded.email });
    if (!aluno) {
      res.status(404).json({ message: "Aluno não encontrado" });
      return;
    }

    const presenca = await Presenca.findOne({
      id_aula: aula._id,
    });

    if (!presenca) {
      res.status(404).json({ message: "Presença não encontrada" });
      return;
    }

    if (presenca.codigo !== codigo) {
      res.status(400).json({ message: "Código inválido" });
      return;
    }

    // Adicione o aluno à lista de id_aluno na presença
    presenca.id_aluno.push(aluno._id);

    // Atualize o status da presença para "presente"
    presenca.status = "presente";
    await presenca.save();

    res.status(200).json({ message: "Presença marcada com sucesso" });
  } catch (error) {
    console.error("Erro ao marcar presença:", error);
    res.status(500).json({ message: "Erro ao marcar presença" });
  }
});



module.exports = router;
