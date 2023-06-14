const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Aluno = require("../models/aluno");
const Professor = require("../models/professor");
const Admin = require("../models/administrador");
const router = express.Router();
const { sendPasswordResetEmail } = require("../utils/email");
require("dotenv").config();

router.get("/", async (req, res) => {
  res.render("loginHome");
});

router.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;
    const aluno = await Aluno.findOne({ email });
    if (aluno) {
      const senhaCorreta = await bcrypt.compare(senha, aluno.senha);
      if (senhaCorreta) {
        const token = jwt.sign(
          { email: aluno.email },
          process.env.TOKEN_SECRET
        );
        res.cookie("token", token);
        return res.json({ success: true, redirectUrl: "/aluno/dashboard" });
      }
    }
    const professor = await Professor.findOne({ email });
    if (professor) {
      const senhaCorreta = await bcrypt.compare(senha, professor.senha);
      if (senhaCorreta) {
        const token = jwt.sign(
          { email: professor.email },
          process.env.TOKEN_SECRET
        );
        res.cookie("token", token);
        return res.json({ success: true, redirectUrl: "/professor/dashboard" });
      }
    }
    const admin = await Admin.findOne({ email });
    if (admin) {
      const senhaCorreta = await bcrypt.compare(senha, admin.senha);
      if (senhaCorreta) {
        const token = jwt.sign(
          { email: admin.email },
          process.env.TOKEN_SECRET
        );
        res.cookie("token", token);
        return res.json({ success: true, redirectUrl: "/admin" });
      }
    }

    return res.json({ success: false, message: "Email ou senha inválidos." });
  } catch (error) {
    console.error("Erro ao realizar login:", error);
    return res.status(500).json({
      success: false,
      message: "Ocorreu um erro ao realizar o login.",
    });
  }
});

router.post("/redefinir-senha", async (req, res) => {
  try {
    const { email } = req.body;

    let user = await Admin.findOne({ email });
    let userType = "admin";

    if (!user) {
      user = await Professor.findOne({ email });
      userType = "professor";
    }

    if (!user) {
      user = await Aluno.findOne({ email });
      userType = "aluno";
    }

    if (user) {
      const resetToken = jwt.sign(
        { email: user.email },
        process.env.TOKEN_SECRET,
        { expiresIn: "1h" }
      );
      const resetLink = `localhost:8000/redefinir-senha/${resetToken}`;
      user.resetToken = resetToken;
      user.resetTokenExpiration = Date.now() + 3600000; // Expira em 1 hora
      await user.save();
      await sendPasswordResetEmail(email, resetLink);
      res.json({
        success: true,
        message:
          "Um email de redefinição de senha foi enviado para o seu endereço de email",
      });
      return;
    }

    res.json({ success: false, message: "Usuário não encontrado" });
  } catch (error) {
    console.error("Erro ao redefinir a senha:", error);
    res
      .status(500)
      .json({ success: false, message: "Erro ao redefinir a senha" });
  }
});

router.get("/redefinir-senha/:resetToken", async (req, res) => {
  try {
    const { resetToken } = req.params;

    let user = await Admin.findOne({ resetToken });
    let userType = "admin";

    if (!user) {
      user = await Professor.findOne({ resetToken });
      userType = "professor";
    }

    if (!user) {
      user = await Aluno.findOne({ resetToken });
      userType = "aluno";
    }

    if (!user) {
      res.json({ success: false, message: "Token inválido ou expirado" });
      return;
    }

    res.render(`${userType}/redefinir-senha`, { resetToken });
  } catch (error) {
    console.error("Erro ao encontrar o usuário:", error);
    res.status(500).json({ success: false, message: "Erro ao encontrar o usuário" });
  }
});

router.post("/redefinir-senha/:resetToken", async (req, res) => {
  try {
    const { resetToken } = req.params;
    const { novaSenha } = req.body;
    const salt = await bcrypt.genSalt(10);

    let user = await Admin.findOne({ resetToken });
    let userType = "admin";

    if (!user) {
      user = await Professor.findOne({ resetToken });
      userType = "professor";
    }

    if (!user) {
      user = await Aluno.findOne({ resetToken });
      userType = "aluno";
    }

    if (!user) {
      res.json({ success: false, message: "Token inválido ou expirado" });
      return;
    }

    if (!novaSenha) {
      res.json({ success: false, message: "Nova senha não fornecida" });
      return;
    }

    const hash = await bcrypt.hash(novaSenha, salt);
    user.senha = hash;
    user.resetToken = null;
    user.resetTokenExpiration = null;
    await user.save();

    res.json({ success: true, message: "Senha redefinida com sucesso" });
  } catch (error) {
    console.error("Erro ao redefinir a senha do usuário:", error);
    res.status(500).json({ success: false, message: "Erro ao redefinir a senha do usuário" });
  }
});



module.exports = router;
