const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();
const Aula = require("../models/aula");
const Professor = require("../models/professor");
const Presenca = require("../models/presenca");
const Aluno = require("../models/aluno");
const AlunoMateria = require("../models/alunoMateria");
const { sendPasswordResetEmail } = require("../utils/email");
require('dotenv').config();

function generateRandomCode() {
  const length = 5;
  const characters = "0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters.charAt(randomIndex);
  }
  return code;
}

function getCurrentDateTime() {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const day = String(currentDate.getDate()).padStart(2, "0");
  const hours = String(currentDate.getHours()).padStart(2, "0");
  const minutes = String(currentDate.getMinutes()).padStart(2, "0");
  const seconds = String(currentDate.getSeconds()).padStart(2, "0");
  const currentDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  return currentDateTime;
}

function parseTime(time) {
  const [hours, minutes] = time.split(":");
  const parsedTime = new Date();
  parsedTime.setHours(Number(hours));
  parsedTime.setMinutes(Number(minutes));
  return parsedTime;
}

router.get("/dashboard", async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    res.redirect("/professor/login");
    return;
  }
  try {
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    const professor = await Professor.findOne({ email: decoded.email });
    if (!professor) {
      res.redirect("/professor/login");
      return;
    }
    const diasSemana = [
      "Domingo",
      "Segunda-feira",
      "Terça-feira",
      "Quarta-feira",
      "Quinta-feira",
      "Sexta-feira",
      "Sábado",
    ];
    const today = new Date().getDay();
    const currentDayOfWeek = diasSemana[today];
    
    const aulas = await Aula.find({
      id_professor: professor._id,
      dia_semana: currentDayOfWeek,
    })
      .populate("id_materia")
      .lean();
    
    res.render("professor/dashboard", {
      nome_completo: professor.nome_completo,
      email: professor.email,
      ra: professor.ra,
      aulas: aulas,
    });
  } catch (error) {
    console.error("Erro ao exibir o dashboard do professor:", error);
    res.status(500).json({ message: "Erro ao exibir o dashboard do professor." });
  }
});

router.post("/gerar-codigo/:aulaId", async (req, res) => {
  const aulaId = req.params.aulaId;
  try {
    const aula = await Aula.findById(aulaId);
    if (!aula) {
      req.flash("error_msg", "Aula não encontrada.");
      return res
        .status(404)
        .json({ success: false, message: "Aula não encontrada." });
    }
    const existingPresenca = await Presenca.findOne({ id_aula: aulaId });
    if (existingPresenca) {
      req.flash("error_msg", "Já existe um código de presença gerado para esta aula.");
      return res.status(400).json({ success: false, message: "Já existe um código de presença gerado para esta aula." });
    }
    
    const currentDateTime = getCurrentDateTime();
    const currentHours = Number(currentDateTime.split(" ")[1].split(":")[0]);
    const currentMinutes = Number(currentDateTime.split(" ")[1].split(":")[1]);
    const currentTime = new Date();
    currentTime.setHours(currentHours);
    currentTime.setMinutes(currentMinutes);
    const startTime = parseTime(aula.horario_inicio);
    const endTime = parseTime(aula.horario_fim);
    if (isTimeBetween(currentTime, startTime, endTime)) {
      const codigo = generateRandomCode();

      const alunosMateria = await AlunoMateria.find({
        id_materia: aula.id_materia,
      }).populate("id_aluno");
      const alunos = alunosMateria.map((alunoMateria) => alunoMateria.id_aluno);

      const presenca = new Presenca({
        id_aula: aulaId,
        data: new Date(currentDateTime),
        codigo: codigo,
        alunos: alunos.map((aluno) => ({
          id_aluno: aluno._id,
          status: "faltou",
        })),
      });

      await presenca.save();
      req.flash("success_msg", "Código de presença gerado com sucesso!");
      return res.status(200).json({ success: true, codigo });
    } else {
      req.flash(
        "error_msg",
        "Não é possível gerar código fora do horário da aula."
      );
      return res.status(400).json({
        success: false,
        message: "Não é possível gerar código fora do horário da aula.",
      });
    }
  } catch (error) {
    console.error("Erro ao gerar código:", error);
    req.flash("error_msg", "Erro ao gerar código.");
    return res
      .status(500)
      .json({ success: false, message: "Erro ao gerar código." });
  }
});

function isTimeBetween(time, startTime, endTime) {
  const startHours = startTime.getHours();
  const startMinutes = startTime.getMinutes();
  const endHours = endTime.getHours();
  const endMinutes = endTime.getMinutes();
  const timeHours = time.getHours();
  const timeMinutes = time.getMinutes();
  if (
    (timeHours > startHours && timeHours < endHours) ||
    (timeHours === startHours && timeMinutes >= startMinutes) ||
    (timeHours === endHours && timeMinutes <= endMinutes)
  ) {
    return true;
  }
  return false;
}

router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

router.post("/redefinir-senha", async (req, res) => {
  const { email } = req.body;

  try {
    const professor = await Professor.findOne({ email });
    if (!professor) {
      res.json({ success: false, message: "Professor não encontrado" });
      return;
    }
    const resetToken = jwt.sign({ email: professor.email }, process.env.TOKEN_SECRET, { expiresIn: "1h" });
    const resetLink = `localhost:8000/professor/redefinir-senha/${resetToken}`; 
    professor.resetToken = resetToken;
    professor.resetTokenExpiration = Date.now() + 3600000; // Expira em 1 hora
    await professor.save();
    await sendPasswordResetEmail(email, resetLink);
    res.json({ success: true, message: "Um email de redefinição de senha foi enviado para o seu endereço de email" });
  } catch (error) {
    console.error("Erro ao redefinir a senha do professor:", error);
    res.status(500).json({ success: false, message: "Erro ao redefinir a senha do aluno" });
  }
});

router.get("/redefinir-senha/:resetToken", (req, res) => {
  res.render("professor/redefinir-senha", { resetToken: req.params.resetToken });
});

router.post("/redefinir-senha/:resetToken", async (req, res) => {
  const salt = await bcrypt.genSalt(10);
  const { resetToken } = req.params;
  const { novaSenha } = req.body;

  try {
    const professor = await Professor.findOne({ resetToken });

    if (!professor) {
      res.json({ success: false, message: "Token inválido ou expirado" });
      return;
    }

    if (!novaSenha) {
      res.json({ success: false, message: "Nova senha não fornecida" });
      return;
    }

    const hash = await bcrypt.hash(novaSenha, salt);
    professor.senha = hash;
    professor.resetToken = null;
    professor.resetTokenExpiration = null;
    await professor.save();

    res.json({ success: true, message: "Senha redefinida com sucesso" });
  } catch (error) {
    console.error("Erro ao redefinir a senha do professor:", error);
    res.status(500).json({ success: false, message: "Erro ao redefinir a senha do professor" });
  }
});


module.exports = router;
