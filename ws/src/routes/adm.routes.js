const bcrypt = require("bcrypt");
const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();

const Admin = require("../models/administrador");

// router.post('/', async (req,res) => {
//     try {
//         const adm = await new Admin(req.body).save();
//         res.json({adm});
//     }catch (err) {
//         res.json({ error: true, message: err.message});
//     }
// });

// rota login usando jwt e bcrypt
router.post("/administrador/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ error: "Email ou senha inválidos" });
    }
    const passwordCheck = await bcrypt.compare(password, admin.password);
    if (!passwordCheck) {
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

module.exports = router;

// --------------------------------------------------------------------------------

// npm install jsonwebtoken
//npm install bcrypt

// rota login alunos
// const Aluno = require("../models/aluno");

// router.post("/aluno/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const aluno = await Aluno.findOne({ email });
//     if (!aluno) {
//       return res.status(401).json({ error: "Email ou senha inválidos" });
//     }
//     const passwordCheck = await bcrypt.compare(password, aluno.password);
//     if (!passwordCheck) {
//       return res.status(401).json({ error: "Email ou senha inválidos" });
//     }
//     const token = jwt.sign({ id: aluno._id }, "chave secreta", {
//       expiresIn: "1h",
//     });
//     res.json({ token });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// ----------------------------------------------------------------------------

// rota login professores
// const Professor = require("../models/professor");

// router.post("/aluno/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const professor = await Professor.findOne({ email });
//     if (!professor) {
//       return res.status(401).json({ error: "Email ou senha inválidos" });
//     }
//     const passwordCheck = await bcrypt.compare(password, professor.password);
//     if (!passwordCheck) {
//       return res.status(401).json({ error: "Email ou senha inválidos" });
//     }
//     const token = jwt.sign({ id: professor._id }, "chave secreta", {
//       expiresIn: "1h",
//     });
//     res.json({ token });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });
