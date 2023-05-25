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
const AlunoMateria = require("../models/alunoMateria");
const Professor = require("../models/professor");
const Aula = require("../models/aula");

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

// rota que faz a listagem dos Cursos
router.get("/cursos", async (req, res) => {
  Curso.find().lean().then((cursos) => {
    res.render("admin/cursos", {cursos:cursos});
  }).catch((err) => {
    req.flash("error_msg","Houve um errro ao listar os cursos");
    res.redirect("/admin");
  });
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

//rota de edição do Curso
router.get("/cursos/editar/:id", async (req, res) =>{
  res.render("admin/editar_cursos")
});

// rota que faz a listagem das Matérias
router.get("/materias", async (req, res) => {
  Materia.find().lean().then((materias) => {
    res.render("admin/materias", {materias:materias});
  }).catch((err) => {
    req.flash("error_msg","Houve um errro ao listar as matérias");
    res.redirect("/admin");
  });
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

// rota que faz a listagem do cursoMatérias
router.get("/cursoMaterias", async (req, res) => {
  CursoMateria.find().populate("id_curso").populate("id_materia").lean().then((cursoMaterias) => {
    res.render("admin/cursoMaterias", {cursoMaterias:cursoMaterias});
  }).catch((err) => {
    req.flash("error_msg","Houve um errro ao listar as matérias em seus respectivos cursos");
    res.redirect("/admin");
  });
});

// rota do formulário para cadastro
router.get("/cursoMaterias/cadastrar", async (req, res) => {
  try {
    const cursosP = Curso.find().lean().exec();
    const materiasP = Materia.find().lean().exec();
    const [curso, materia] = await Promise.all([cursosP, materiasP]);
    res.render("admin/cadastrar_cursoMaterias", {
      curso: curso,
      materia: materia,
    });
  } catch (err) {
    req.flash("error_msg", "Houve um erro ao carregar os cursos e matérias");
    res.redirect("/admin");
  }
});

// rota que valida e cadastra as respecitvas matérias em um curso
router.post("/cursoMaterias/novo", async (req, res) => {
  const novoCursoMateria = {
    id_curso: req.body.id_curso,
    id_materia: req.body.id_materia,
  };

  // Validação dos campos usando Joi
  const schema = Joi.object({
    id_curso: Joi.string().required().messages({
      "any.required": "O campo curso é obrigatório",
      "string.empty": "Por favor, selecione um curso",
    }),
    id_materia: Joi.alternatives()
      .try(
        Joi.array().items(Joi.string()).unique().min(2).required(),
        Joi.string()
          .messages({
            "string.empty": "Por favor, selecione uma ou mais matérias",
          })
          .error(new Error(":)"))
      )
      .messages({
        "any.required": "O campo matéria é obrigatório",
        "array.unique": "Não é permitido cadastrar matérias iguais",
      }),
  });

  const { error } = schema.validate(novoCursoMateria);
  if (error) {
    req.flash(
      "error_msg",
      "Erro ao cadastrar as matérias no curso: " + error.details[0].message
    );
    res.redirect("/admin/cursoMaterias/cadastrar");
    return;
  }

  // Verificar se o curso já está cadastrado na relação cursoMaterias
  const cursoMateriaExistente = await CursoMateria.findOne({
    id_curso: novoCursoMateria.id_curso,
  }).lean();
  if (cursoMateriaExistente) {
    req.flash("error_msg", "Não é permitido cadastrar o mesmo curso novamente");
    res.redirect("/admin/cursoMaterias/cadastrar");
    return;
  }

  new CursoMateria(novoCursoMateria)
    .save()
    .then(() => {
      req.flash("success_msg", "Matérias cadastradas no curso com sucesso");
      res.redirect("/admin/cursoMaterias");
    })
    .catch((err) => {
      req.flash("error_msg", "Erro ao cadastrar as matérias no curso");
      res.redirect("/admin/cursoMaterias/cadastrar");
    });
});

// rota que faz a listagem dos Alunos
router.get("/alunos", async (req, res) => {
  Aluno.find().populate("id_curso").lean().then((alunos) => {
    res.render("admin/alunos", {alunos:alunos});
  }).catch((err) => {
    req.flash("error_msg","Houve um errro ao listar os alunos");
    res.redirect("/admin");
  });
});

// rota do formulário para cadastro
router.get("/alunos/cadastrar", async (req, res) => {
  Curso.find()
    .lean()
    .then((curso) => {
      res.render("admin/cadastrar_alunos", { curso: curso });
    })
    .catch((err) => {
      req.flash("error_msg", "Houve um erro ao carregar os cursos");
      res.redirect("/admin");
    });
});

// rota que valida e cadastra o novo aluno
router.post("/alunos/novo", async (req, res) => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(req.body.senha, salt);
  const novoAluno = {
    ra: req.body.ra,
    nome_completo: req.body.nome_completo,
    semestre: req.body.semestre,
    grupo: req.body.grupo,
    turma: req.body.turma,
    lab: req.body.lab,
    email: req.body.email,
    senha: hash,
    id_curso: req.body.id_curso,
  };

  // Validação dos campos usando Joi
  const schema = Joi.object({
    ra: Joi.string().required().length(10).messages({
      "any.required": "O campo RA do aluno é obrigatório",
      "string.empty": "Por favor, informe um valor para o RA do aluno",
      "string.length":
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
    grupo: Joi.string().required().messages({
      "any.required": "Por favor, informe o grupo do aluno",
      "nstring.empty": "Por favor, informe o grupo do aluno",
    }),
    turma: Joi.string().required().messages({
      "any.required": "Por favor, informe a turma do aluno",
      "nstring.empty": "Por favor, informe a turma do aluno",
    }),
    lab: Joi.string().required().messages({
      "any.required": "Por favor informe o laboratório do aluno",
      "nstring.empty": "Por favor, informe o laboratório do aluno",
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
      "any.required": "O campo curso do aluno é obrigatório",
      "string.empty": "Por favor, selecione um curso",
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

// rota que faz a listagem dos alunoMatérias
router.get("/alunoMaterias", async (req, res) => {
  AlunoMateria.find().populate("id_aluno").populate("id_materia").lean().then((alunoMaterias) => {
    res.render("admin/alunoMaterias", {alunoMaterias:alunoMaterias});
  }).catch((err) => {
    req.flash("error_msg","Houve um errro ao listar as matérias em seus respectivos alunos");
    res.redirect("/admin");
  });
});

// rota do formulário para cadastro
router.get("/alunoMaterias/cadastrar", async (req, res) => {
  try {
    const alunosP = Aluno.find().lean().exec();
    const materiasP = Materia.find().lean().exec();
    const [aluno, materia] = await Promise.all([alunosP, materiasP]);
    res.render("admin/cadastrar_alunoMaterias", {
      aluno: aluno,
      materia: materia,
    });
  } catch (err) {
    req.flash("error_msg", "Houve um erro ao carregar os alunos e matérias");
    res.redirect("/admin");
  }
});

// rota que valida e cadastra as respecitvas matérias em um aluno
router.post("/alunoMaterias/novo", async (req, res) => {
  const novoAlunoMateria = {
    id_aluno: req.body.id_aluno,
    id_materia: req.body.id_materia,
  };

  // Validação dos campos usando Joi
  const schema = Joi.object({
    id_aluno: Joi.string().required().messages({
      "any.required": "O campo aluno é obrigatório",
      "string.empty": "Por favor, selecione um aluno",
    }),
    id_materia: Joi.alternatives()
      .try(
        Joi.array().items(Joi.string()).unique().min(2).required(),
        Joi.string()
          .messages({
            "string.empty": "Por favor, selecione uma ou mais matérias",
          })
          .error(new Error(":)"))
      )
      .messages({
        "any.required": "O campo matéria é obrigatório",
        "array.unique": "Não é permitido cadastrar matérias iguais",
      }),
  });

  const { error } = schema.validate(novoAlunoMateria);
  if (error) {
    req.flash(
      "error_msg",
      "Erro ao cadastrar as matérias no aluno: " + error.details[0].message
    );
    res.redirect("/admin/alunoMaterias/cadastrar");
    return;
  }

  // Verificar se o aluno já está cadastrado na relação alunoMaterias
  const alunoMateriaExistente = await AlunoMateria.findOne({
    id_aluno: novoAlunoMateria.id_aluno,
  }).lean();
  if (alunoMateriaExistente) {
    req.flash("error_msg", "Não é permitido cadastrar o mesmo aluno novamente");
    res.redirect("/admin/alunoMaterias/cadastrar");
    return;
  }

  new AlunoMateria(novoAlunoMateria)
    .save()
    .then(() => {
      req.flash("success_msg", "Matérias cadastradas no aluno com sucesso");
      res.redirect("/admin/alunoMaterias");
    })
    .catch((err) => {
      req.flash("error_msg", "Erro ao cadastrar as matérias no aluno");
      res.redirect("/admin/alunoMaterias/cadastrar");
    });
});

// rotas que faz a listagem dos Professores
router.get("/professores", async (req, res) => {
  Professor.find().lean().then((professores) => {
    res.render("admin/professores", {professores:professores});
  }).catch((err) => {
    req.flash("error_msg","Houve um errro ao listar os professores");
    res.redirect("/admin");
  });
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
    ra: Joi.string().required().length(10).messages({
      "any.required": "O campo RA do professor é obrigatório",
      "string.empty": "Por favor, informe um valor para o RA do professor",
      "string.length":
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

// rota que faz a listagem das Aulas
router.get("/aulas", async (req, res) => {
  Aula.find().populate("id_professor").populate("id_materia").lean().then((aulas) => {
    res.render("admin/aulas", {aulas:aulas});
  }).catch((err) => {
    req.flash("error_msg","Houve um errro ao listar as aulas");
    res.redirect("/admin");
  });
});

// rota do formulário para cadastro
router.get("/aulas/cadastrar", async (req, res) => {
  try {
    const professoresP = Professor.find().lean().exec();
    const materiasP = Materia.find().lean().exec();
    const [professor, materia] = await Promise.all([professoresP, materiasP]);
    res.render("admin/cadastrar_aulas", {
      professor: professor,
      materia: materia,
    });
  } catch (err) {
    req.flash(
      "error_msg",
      "Houve um erro ao carregar os professores e matérias"
    );
    res.redirect("/admin");
  }
});

// rota que valida e cadastra a nova Aula - obs: precisa dar uma revisada por causa das PAE
router.post("/aulas/novo", async (req, res) => {
  const novaAula = {
    horario_inicio: req.body.horario_inicio,
    horario_fim: req.body.horario_fim,
    tipo_aula: req.body.tipo_aula,
    id_materia: req.body.id_materia,
    id_professor: req.body.id_professor,
    dia_semana: req.body.dia_semana,
    sala: req.body.sala,
    grupo: req.body.grupo,
    turma: req.body.turma,
    lab: req.body.lab,
  };

  // Validação dos campos usando Joi
  const schema = Joi.object({
    horario_inicio: Joi.string().length(5).required().messages({
      "any.required": "O campo horário de início é obrigatório",
      "string.empty": "Por favor, informe o horário de início",
      "string.length": "O campo horário de início deve possuir 5 caracteres, incluindo o dois pontos"
    }),
    horario_fim: Joi.string().length(5).required().messages({
      "any.required": "O campo horário de fim é obrigatório",
      "string.empty": "Por favor, informe o horário de fim",
      "string.length": "O campo horário de fim deve possuir 5 caracteres, incluindo o dois pontos" 
    }),
    tipo_aula: Joi.string().valid("TEO", "LAB").required().messages({
      "any.required": "O campo tipo de aula é obrigatório",
      "string.empty": "Por favor, selecione um tipo de aula",
      "any.only": "O tipo de aula deve ser TEO ou LAB",
    }),
    id_materia: Joi.string().required().messages({
      "any.required": "O campo matéria é obrigatório",
      "string.empty": "Por favor, selecione uma matéria",
    }),
    id_professor: Joi.string().required().messages({
      "any.required": "O campo professor é obrigatório",
      "string.empty": "Por favor, selecione um professor",
    }),
    dia_semana: Joi.string().valid(
      "Domingo",
      "Segunda-feira",
      "Terça-feira",
      "Quarta-feira",
      "Quinta-feira",
      "Sexta-feira",
      "Sábado"
    ).required().messages({
      "any.required": "O campo dia da semana é obrigatório",
      "string.empty": "Por favor, selecione um dia da semana",
      "any.only": "O dia da semana selecionado não é válido",
    }),
    sala: Joi.string().required().messages({
      "any.required": "O campo sala é obrigatório",
      "string.empty": "Por favor, informe a sala",
    }),
    grupo: Joi.string().allow('').optional(),
    turma: Joi.string().allow('').optional(),
    lab: Joi.string().allow('').optional(),
  });

  const { error } = schema.validate(novaAula);
  if (error) {
    req.flash(
      "error_msg",
      "Erro ao cadastrar aula: " + error.details[0].message
    );
    res.redirect("/admin/aulas/cadastrar");
    return;
  }

  // verificação para não permitir cadastrar aulas iguais

  new Aula(novaAula)
    .save()
    .then(() => {
      req.flash("success_msg", "Aula cadastrada com sucesso");
      res.redirect("/admin/aulas");
    })
    .catch((err) => {
      req.flash("error_msg", "Erro ao aula");
      res.redirect("/admin/aulas/cadastrar");
    });
});

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

module.exports = router;
