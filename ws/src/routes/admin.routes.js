// importação das dependências
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Joi = require("joi");
const router = express.Router();

// importação dos models do banco de dados
const Admin = require("../models/administrador");
const Curso = require("../models/curso");
const Materia = require("../models/materia");
const CursoMateria = require("../models/cursoMateria");
const Aluno = require("../models/aluno");
const Professor = require("../models/professor");
const Aula = require("../models/Aula");

// rota principal ADM
router.get("/", async (req, res) => {
  res.render("admin/index");
});

// rota login usando jwt e bcrypt
router.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ error: "Email ou senha inválidos" });
    }
    const checaSenha = await bcrypt.compare(senha, admin.senha);
    if (!checaSenha) {
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

// rotas dos Cursos
router.get("/cursos", async (req, res) => {
  res.render("admin/cursos");
});

// rota do formulário para cadastro
router.get("/cursos/cadastrar", async (req, res) => {
  res.render("admin/cadastrar_cursos");
});

//rota que valida e cadastra o novo Curso
router.post("/cursos/novo", async (req, res) => {
  const novoCurso = {
    cod_curso: req.body.cod_curso.toUpperCase(),
    nome_curso: req.body.nome.toUpperCase(),
  };

  // Validação dos campos usando Joi
  const schema = Joi.object({
    cod_curso: Joi.string().required().messages({
      "any.required": "O campo código do curso é obrigatório",
      "string.empty": "Por favor, informe um valor para o código do curso",
    }),
    nome_curso: Joi.string().required().messages({
      "any.required": "O campo nome do curso é obrigatório",
      "string.empty": "Por favor, informe um valor para o nome do curso",
    }),
  });
  const { error } = schema.validate(novoCurso);
  if (error) {
    req.flash(
      "error_msg",
      "Erro ao cadastrar curso: " + error.details[0].message
    );
    res.redirect("/admin/cursos/cadastrar");
    return;
  }

  // Verifica se já existe algum curso cadastrado com o mesmo nome ou código
  const cursoExistente = await Curso.findOne({
    $or: [
      { cod_curso: novoCurso.cod_curso },
      { nome_curso: novoCurso.nome_curso },
    ],
  });

  if (cursoExistente) {
    if (cursoExistente.cod_curso === novoCurso.cod_curso) {
      req.flash("error_msg", "Já existe um curso cadastrado com este código");
    } else {
      req.flash("error_msg", "Já existe um curso cadastrado com este nome");
    }
    res.redirect("/admin/cursos/cadastrar");
    return;
  }

  new Curso(novoCurso)
    .save()
    .then(() => {
      req.flash("success_msg", "Curso cadastrado com sucesso");
      res.redirect("/admin/cursos");
    })
    .catch((err) => {
      req.flash("error_msg", "Erro ao cadastrar curso");
      res.redirect("/admin/cursos/cadastrar");
    });
});

// rotas das Matérias
router.get("/materias", async (req, res) => {
  res.render("admin/materias");
});

// rota do formulário para cadastro
router.get("/materias/cadastrar", async (req, res) => {
  res.render("admin/cadastrar_materias");
});

// rota que valida e cadastra a nova Matéria
router.post("/materias/novo", async (req, res) => {
  const novaMateria = {
    cod_materia: req.body.cod_materia.toUpperCase(),
    nome_materia: req.body.nome.toUpperCase(),
  };

  // Validação dos campos usando Joi
  const schema = Joi.object({
    cod_materia: Joi.string().required().messages({
      "any.required": "O campo código da matéria é obrigatório",
      "string.empty": "Por favor, informe um valor para o código da matéria",
    }),
    nome_materia: Joi.string().required().messages({
      "any.required": "O campo nome da matéria é obrigatório",
      "string.empty": "Por favor, informe um valor para o nome da matéria",
    }),
  });
  const { error } = schema.validate(novaMateria);
  if (error) {
    req.flash(
      "error_msg",
      "Erro ao cadastrar matéria: " + error.details[0].message
    );
    res.redirect("/admin/materias/cadastrar");
    return;
  }

  // Verifica se já existe alguma matéria cadastrado com o mesmo nome ou código
  const materiaExistente = await Materia.findOne({
    $or: [
      { cod_materia: novaMateria.cod_materia },
      { nome_materia: novaMateria.nome_materia },
    ],
  });

  if (materiaExistente) {
    if (materiaExistente.cod_materia === novaMateria.cod_materia) {
      req.flash(
        "error_msg",
        "Já existe uma matéria cadastrado com este código"
      );
    } else {
      req.flash("error_msg", "Já existe uma matéria cadastrado com este nome");
    }
    res.redirect("/admin/materias/cadastrar");
    return;
  }

  new Materia(novaMateria)
    .save()
    .then(() => {
      req.flash("success_msg", "Matéria cadastrada com sucesso");
      res.redirect("/admin/materias");
    })
    .catch((err) => {
      req.flash("error_msg", "Erro ao cadastrar matéria");
      res.redirect("/admin/materias/cadastrar");
    });
});

// rotas dos cursos-matérias
router.get("/cursoMaterias", async (req, res) => {
  res.send("Página de matérias associadas à um curso");
});

// rotas dos Alunos
router.get("/alunos", async (req, res) => {
  res.render("admin/alunos");
});

// rota do formulário para cadastro
router.get("/alunos/cadastrar", async (req, res) => {
  Curso.find()
    .lean()
    .then((curso) => {
      console.log(curso); // imprime todos os cursos no console
      res.render("admin/cadastrar_alunos", { curso: curso });
    })
    .catch((err) => {
      req.flash("error_msg", "Houve um erro ao carregar os cursos");
      res.redirect("/admin");
    });
});

//rota que valida e cadastra o novo aluno
router.post("/alunos/novo", async (req, res) => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(req.body.senha, salt);
  const novoAluno = {
    ra: req.body.ra,
    nome_completo: req.body.nome_completo,
    semestre: req.body.semestre,
    gtl: req.body.gtl,
    email: req.body.email,
    senha: hash,
    id_curso: req.body.id_curso,
  };

  // Validação dos campos usando Joi
  const schema = Joi.object({
    ra: Joi.string().required().min(10).max(10).messages({
      "any.required": "O campo RA do aluno é obrigatório",
      "string.empty": "Por favor, informe um valor para o RA do aluno",
      "string.min":
        "O RA deve possuir 10 caracteres, incluindo o ponto e traço",
      "string.max":
        "O RA deve possuir 10 caracteres, incluindo o ponto e traço",
    }),
    nome_completo: Joi.string().required().messages({
      "any.required": "O campo nome do aluno é obrigatório",
      "string.empty": "Por favor, informe o nome do aluno",
    }),
    semestre: Joi.number().required().messages({
      "any.required": "O campo semestre do aluno é obrigatório",
      "number.base": "Por favor, informe um valor numérico",
    }),
    gtl: Joi.number().required().messages({
      "any.required": "O campo gtl do aluno é obrigatório",
      "number.base": "Por favor, informe um valor numérico",
    }),
    email: Joi.string().email().required().messages({
      "any.required": "O campo email do aluno é obrigatório",
      "string.empty": "Por favor, informe um valor para o email do aluno",
      "string.email": "Por favor, informe um email válido",
    }),
    senha: Joi.string().required().messages({
      "any.required": "O campo senha do aluno é obrigatório",
      "string.empty": "Por favor, informe um valor para a senha do aluno",
    }),
    id_curso: Joi.string().required().messages({
      "any.required": "O campo id do curso do aluno é obrigatório",
      "string.empty": "aaaaaaaaaaaaaaaaaaaaa",
    }),
  });

  const { error } = schema.validate(novoAluno);
  if (error) {
    req.flash(
      "error_msg",
      "Erro ao cadastrar aluno: " + error.details[0].message
    );
    res.redirect("/admin/alunos/cadastrar");
    return;
  }

  // Verifica se já existe algum aluno cadastrado com o mesmo RA
  const alunoExistente = await Aluno.findOne({
    $or: [{ ra: novoAluno.ra }],
  });

  if (alunoExistente) {
    req.flash("error_msg", "Já existe um aluno cadastrado com este RA");
    res.redirect("/admin/alunos/cadastrar");
    return;
  }

  new Aluno(novoAluno)
    .save()
    .then(() => {
      req.flash("success_msg", "Aluno cadastrado com sucesso");
      res.redirect("/admin/alunos");
    })
    .catch((err) => {
      req.flash("error_msg", "Erro ao cadastrar aluno");
      res.redirect("/admin/alunos/cadastrar");
    });
});

// rotas dos alunos-matérias
router.get("/alunoMaterias", async (req, res) => {
  res.send("Página de matérias associadas à um aluno");
});

// rotas dos Professores
router.get("/professores", async (req, res) => {
  res.render("admin/professores");
});

// rota do formulário para cadastro
router.get("/professores/cadastrar", async (req, res) => {
  res.render("admin/cadastrar_professores");
});

//rota que valida e cadastra o novo Professor
router.post("/professores/novo", async (req, res) => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(req.body.senha, salt);
  const novoProfessor = {
    ra: req.body.ra,
    nome_completo: req.body.nome_completo,
    email: req.body.email,
    senha: hash,
  };

  // Validação dos campos usando Joi
  const schema = Joi.object({
    ra: Joi.string().required().min(10).max(10).messages({
      "any.required": "O campo RA do professor é obrigatório",
      "string.empty": "Por favor, informe um valor para o RA do professor",
      "string.min":
        "O RA deve possuir 10 caracteres, incluindo o ponto e traço",
      "string.max":
        "O RA deve possuir 10 caracteres, incluindo o ponto e traço",
    }),
    nome_completo: Joi.string().required().messages({
      "any.required": "O campo nome do professor é obrigatório",
      "string.empty": "Por favor, informe o nome do professor.",
    }),
    email: Joi.string().email().required().messages({
      "any.required": "O campo email do professor é obrigatório",
      "string.empty": "Por favor, informe um valor para o email do professor",
      "string.email": "Por favor, informe um email válido",
    }),
    senha: Joi.string().required().messages({
      "any.required": "O campo senha do professor é obrigatório",
      "string.empty": "Por favor, informe um valor para a senha do professor",
    }),
  });

  const { error } = schema.validate(novoProfessor);
  if (error) {
    req.flash(
      "error_msg",
      "Erro ao cadastrar professor: " + error.details[0].message
    );
    res.redirect("/admin/professores/cadastrar");
    return;
  }

  // Verifica se já existe algum professor cadastrado com o mesmo RA
  const professorExistente = await Professor.findOne({
    $or: [{ ra: novoProfessor.ra }],
  });

  if (professorExistente) {
    req.flash("error_msg", "Já existe um professor cadastrado com este RA");
    res.redirect("/admin/professores/cadastrar");
    return;
  }

  new Professor(novoProfessor)
    .save()
    .then(() => {
      req.flash("success_msg", "Professor cadastrado com sucesso");
      res.redirect("/admin/professores");
    })
    .catch((err) => {
      req.flash("error_msg", "Erro ao cadastrar professor");
      res.redirect("/admin/professores/cadastrar");
    });
});

router.get("/aulas", async (req, res) => {
  res.send("Página de aulas");
});

// router.post("/cadastro", async (req, res) => {
//   try {
//     const { email, senha } = req.body;
//     const senhaSegura = await bcrypt.hash(senha, 10);
//     const admin = new Admin({ email, senha: senhaSegura });
//     await admin.save();
//     res.status(201).json(admin);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// const wifiName = require("wifi-name");

// function obterNomeRedeWifi() {
//   return new Promise((resolve, reject) => {
//     wifiName().then(nomeRede => {
//       resolve(nomeRede);
//     }).catch(err => {
//       reject(err);
//     });
//   });
// }

// router.get('/wifi', async (req, res) => {
//   try {
//     const nomeRede = await obterNomeRedeWifi();
//     if(nomeRede == 'IDGS 5G') {

//       res.send('Nome da rede Wi-Fi: ' + nomeRede);
//     }
//     else {
//       res.send('A rede conectada não é a IDGS 5G');
//     }
//   } catch (err) {
//     console.error('Erro ao obter o nome da rede Wi-Fi:', err);
//     res.status(500).send('Erro ao obter o nome da rede Wi-Fi');
//   }
// });

const axios = require('axios');


router.get('/localizacao', async (req, res) => {
  try {
    const response = await axios.get('http://ip-api.com/json');
    const { city, regionName, country, lat, lon } = response.data;

    const location = `Localização: ${city}, ${regionName}, ${country}`;
    const coordinates = `Coordenadas: ${lat}, ${lon}`;

    res.send(`${location}\n${coordinates}`);
  } catch (error) {
    console.error('Ocorreu um erro ao obter a localização:', error.message);
    res.status(500).send('Erro ao obter a localização');
  }
});





module.exports = router;
