const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const router = express.Router();

const Professor = require("../models/professor");

router.get("/", async (req, res) => {
  res.send("Página professor");
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const professor = await Professor.findOne({ email });
    if (!professor) {
      return res.status(401).json({ error: "Email ou senha inválidos" });
    }
    const passwordCheck = await bcrypt.compare(password, professor.password);
    if (!passwordCheck) {
      return res.status(401).json({ error: "Email ou senha inválidos" });
    }
    const token = jwt.sign({ id: professor._id }, "chave secreta", {
      expiresIn: "1h",
    });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
