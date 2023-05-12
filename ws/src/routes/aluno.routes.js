const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const router = express.Router();

const Aluno = require("../models/aluno");

router.get("/", async (req, res) => {
  res.send("Página login aluno");
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const aluno = await Aluno.findOne({ email });
    if (!aluno) {
      return res.status(401).json({ error: "Email ou senha inválidos" });
    }
    const passwordCheck = await bcrypt.compare(password, aluno.password);
    if (!passwordCheck) {
      return res.status(401).json({ error: "Email ou senha inválidos" });
    }
    const token = jwt.sign({ id: aluno._id }, "chave secreta", {
      expiresIn: "1h",
    });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
