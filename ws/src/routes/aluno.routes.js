const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();
const Aula = require("../models/aula");
const Aluno = require("../models/aluno");
const AlunoMateria = require("../models/alunoMateria");
const Presenca = require("../models/presenca");

function getCurrentDate() {
  const currentDate = new Date();
  const timezoneOffset = currentDate.getTimezoneOffset();
  const adjustedDate = new Date(currentDate.getTime() - timezoneOffset * 60000);
  return adjustedDate;
}

function parseTime(timeString) {
  const [hours, minutes] = timeString.split(":");
  const parsedTime = new Date();
  parsedTime.setHours(hours);
  parsedTime.setMinutes(minutes);
  return parsedTime;
}

function isTimeBetween(currentTime, startTime, endTime) {
  return currentTime >= startTime && currentTime <= endTime;
}

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
    const filter = {
      $or: [
        {
          enum_aula: "Padrão",
          id_materia: { $in: alunoMateria.id_materia },
          grupo: aluno.grupo,
          turma: aluno.turma,
          lab: aluno.lab,
        },
        {
          enum_aula: "Padrão",
          id_materia: { $in: alunoMateria.id_materia },
          grupo: aluno.grupo,
          turma: aluno.turma,
        },
        {
          enum_aula: "Padrão",
          id_materia: { $in: alunoMateria.id_materia },
          grupo: aluno.grupo,
        },
        { enum_aula: "Pae" },
      ],
    };
    const diasSemana = [
      "Domingo",
      "Segunda-feira",
      "Terça-feira",
      "Quarta-feira",
      "Quinta-feira",
      "Sexta-feira",
      "Sábado",
    ];
    const hoje = getCurrentDate().getUTCDay();
    const diaAtual = diasSemana[hoje];
    const aulas = await Aula.find({
      ...filter,
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
      req.flash("error_msg", "Aula não encontrada");
      res.redirect("/aluno/dashboard");
      return;
    }

    const token = req.cookies.token;
    if (!token) {
      req.flash("error_msg", "Token não fornecido");
      res.redirect("/aluno/dashboard");
      return;
    }

    const decoded = jwt.verify(token, "chave_secreta");
    const aluno = await Aluno.findOne({ email: decoded.email });
    if (!aluno) {
      req.flash("error_msg", "Aluno não encontrado");
      res.redirect("/aluno/dashboard");
      return;
    }

    const presenca = await Presenca.findOne({
      id_aula: aula._id,
    });
    if (!presenca) {
      req.flash("error_msg", "Presença não encontrada");
      res.redirect("/aluno/dashboard");
      return;
    }

    if (presenca.codigo !== codigo) {
      req.flash("error_msg", "Código inválido");
      res.redirect("/aluno/dashboard");
      return;
    }

    const currentDateTime = new Date();
    const currentHours = Number(
      currentDateTime.toISOString().split("T")[1].split(":")[0]
    );
    const currentMinutes = Number(
      currentDateTime.toISOString().split("T")[1].split(":")[1]
    );
    const currentTime = new Date();
    currentTime.setHours(currentHours);
    currentTime.setMinutes(currentMinutes);
    const startTime = parseTime(aula.horario_inicio);
    const endTime = parseTime(aula.horario_fim);

    if (isTimeBetween(currentTime, startTime, endTime)) {
      const alunoPresenca = presenca.alunos.find(
        (alunoPresenca) =>
          alunoPresenca.id_aluno.toString() === aluno._id.toString()
      );

      if (alunoPresenca) {
        alunoPresenca.status = "presente";
        await presenca.save();
        req.flash("success_msg", "Presença marcada com sucesso");
        res.redirect("/aluno/dashboard");
      } else {
        req.flash("error_msg", "Aluno não encontrado na presença");
        res.redirect("/aluno/dashboard");
        return;
      }
    } else {
      req.flash(
        "error_msg",
        "Não é possível marcar presença fora do horário da aula"
      );
      res.redirect("/aluno/dashboard");
    }
  } catch (error) {
    console.error("Erro ao marcar presença:", error);
    req.flash("error_msg", "Erro ao marcar presença");
    res.redirect("/aluno/dashboard");
  }
});

module.exports = router;
