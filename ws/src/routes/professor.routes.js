const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();

const Professor = require("../models/professor");

router.get("/login", (req, res) => {
  res.render("professor/login");
});

router.get("/dashboard", (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    res.redirect("/professor/login");
    return;
  }

  try {
    const decoded = jwt.verify(token, "chave_secreta");

    // Encontre o professor no banco de dados com base no email decodificado
    Professor.findOne({ email: decoded.email })
      .then(professor => {
        if (!professor) {
          res.redirect("/professor/login");
          return;
        }

        // Renderize a página de dashboard passando as informações do professor como dados
        res.render("professor/dashboard", {
          nome_completo: professor.nome_completo,
          email: professor.email,
          ra: professor.ra
        });
      })
      .catch(err => {
        console.error("Erro ao buscar professor:", err);
        res.redirect("/professor/login");
      });
  } catch (error) {
    console.error("Erro ao verificar token:", error);
    res.redirect("/professor/login");
  }
});


// Rota de login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  try {
    const professor = await Professor.findOne({ email });

    if (!professor) {
      res.json({ success: false });
      return;
    }

    const senhaCorreta = await bcrypt.compare(senha, professor.senha);

    if (senhaCorreta) {
      const token = jwt.sign({ email: professor.email }, "chave_secreta");
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
  