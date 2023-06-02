const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();
const Aula = require("../models/aula");
const Professor = require("../models/professor");
const Presenca = require("../models/presenca");
const Aluno = require("../models/aluno");
const AlunoMateria = require("../models/alunoMateria");


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

router.get("/login", (req, res) => {
  res.render("professor/login");
});

router.get("/dashboard", async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    res.redirect("/professor/login");
    return;
  }
  try {
    const decoded = jwt.verify(token, "chave_secreta");
    const professor = await Professor.findOne({ email: decoded.email });
    if (!professor) {
      res.redirect("/professor/login");
      return;
    }
    const aulas = await Aula.find({ id_professor: professor._id })
      .populate("id_materia")
      .lean();
    const aulasComNomeMateria = aulas.map((aula) => ({
      ...aula,
      nome_materia: aula.id_materia.nome,
    }));
    res.render("professor/dashboard", {
      nome_completo: professor.nome_completo,
      email: professor.email,
      ra: professor.ra,
      aulas: aulasComNomeMateria,
    });
  } catch (error) {
    console.error("Erro ao verificar token:", error);
    res.redirect("/professor/login");
  }
});

router.post("/login", async (req, res) => {
  const { email, senha } = req.body;
  try {
    const professor = await Professor.findOne({ email });
    if (!professor) {
      req.flash("error_msg", "Professor não encontrado.");
      return res.json({ success: false, message: "Professor não encontrado." });
    }
    const senhaCorreta = await bcrypt.compare(senha, professor.senha);
    if (senhaCorreta) {
      const token = jwt.sign({ email: professor.email }, "chave_secreta");
      res.cookie("token", token);
      return res.json({
        success: true,
        message: "Login realizado com sucesso.",
      });
    } else {
      req.flash("error_msg", "Senha incorreta.");
      return res.json({ success: false, message: "Senha incorreta." });
    }
  } catch (error) {
    console.error("Erro ao realizar login:", error);
    return res.json({
      success: false,
      message: "Ocorreu um erro ao realizar o login.",
    });
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
  res.redirect("/professor/login");
});

module.exports = router;
