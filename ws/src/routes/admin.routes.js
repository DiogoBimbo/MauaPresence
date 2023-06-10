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
const Presenca = require("../models/presenca");

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

//rota de edição do Curso que carrega o formulário 
router.get("/cursos/editar/:id", async (req, res) =>{
  Curso.findOne({_id: req.params.id}).lean().then((curso) => {
    res.render("admin/editar_cursos", {curso:curso});
  }).catch((err) => {
    req.flash("error_msg", "Houve um erro ao carregar o formulário de edição");
    res.redirect("/admin/cursos")
  });
});

//rota de edição do Curso que salva o curso editado - Obs : mesma validação (modularizar o JOI)
router.post("/cursos/editar", async (req, res) => {
  const { id, cod_curso, nome } = req.body;
  const upCodCurso = cod_curso.toUpperCase();
  const upNomeCurso = nome.toUpperCase();
  
  try {
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
    
      const { error } = schema.validate({
        cod_curso: upCodCurso,
        nome_curso: upNomeCurso,
      });
    
      if (error) {
        req.flash("error_msg", "Erro ao editar curso: " + error.details[0].message);
        res.redirect(`/admin/cursos/editar/${id}`);
        return;
      }
    // Encontra o curso pelo ID
    const curso = await Curso.findOne({ _id: id });

    // Verifica se já existe algum curso cadastrado com o mesmo código ou nome
    const cursoExistente = await Curso.findOne({
      $and: [
        { _id: { $ne: id } },
        {
          $or: [
            { cod_curso: upCodCurso },
            { nome_curso: upNomeCurso },
          ],
        },
      ],
    });

    if (cursoExistente) {
      if (cursoExistente.cod_curso === upCodCurso) {
        req.flash("error_msg", "Já existe um curso cadastrado com este código");
      } else {
        req.flash("error_msg", "Já existe um curso cadastrado com este nome");
      }
      res.redirect(`/admin/cursos/editar/${id}`);
      return;
    }

    // Atualiza os valores do curso
    curso.cod_curso = upCodCurso;
    curso.nome_curso = upNomeCurso;

    // Salva as alterações
    await curso.save();
    req.flash("success_msg", "Curso editado com sucesso");
    res.redirect("/admin/cursos");
  } catch (err) {
    req.flash("error_msg", "Houve um erro ao salvar a edição");
    res.redirect("/admin/cursos");
  }
});

//rota que deleta o Curso
router.get("/cursos/deletar/:id", async (req, res) => {
  Curso.deleteOne({_id: req.params.id}).then(() =>{
    req.flash("success_msg", "Curso deletado com sucesso");
    res.redirect("/admin/cursos");
  }).catch((err) => {
    req.flash("error_msg", "Houve um erro interno");
    res.redirect("/admin/cursos");
  });
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

//rota de edição da Matéria que carrega o formulário 
router.get("/materias/editar/:id", async (req, res) =>{
  Materia.findOne({_id: req.params.id}).lean().then((materia) => {
    res.render("admin/editar_materias", {materia:materia});
  }).catch((err) => {
    req.flash("error_msg", "Houve um erro ao carregar o formulário de edição");
    res.redirect("/admin/materias")
  });
});

//rota de edição da Matéria que salva a matéria editada - Obs : mesma validação (modularizar o JOI)
router.post("/materias/editar", async (req, res) => {
  const { id, cod_materia, nome } = req.body;
  const upCodMateria = cod_materia.toUpperCase();
  const upNomeMateria = nome.toUpperCase();
  
  try {
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
    
      const { error } = schema.validate({
        cod_materia: upCodMateria,
        nome_materia: upNomeMateria,
      });
    
      if (error) {
        req.flash("error_msg", "Erro ao editar matéria: " + error.details[0].message);
        res.redirect(`/admin/materias/editar/${id}`);
        return;
      }
    // Encontra a matéria pelo ID
    const materia = await Materia.findOne({ _id: id });

    // Verifica se já existe alguma matéria cadastrada com o mesmo código ou nome
    const materiaExistente = await Materia.findOne({
      $and: [
        { _id: { $ne: id } },
        {
          $or: [
            { cod_materia: upCodMateria },
            { nome_materia: upNomeMateria },
          ],
        },
      ],
    });

    if (materiaExistente) {
      if (materiaExistente.cod_materia === upCodMateria) {
        req.flash("error_msg", "Já existe uma matéria cadastrada com este código");
      } else {
        req.flash("error_msg", "Já existe uma matéria cadastrada com este nome");
      }
      res.redirect(`/admin/materias/editar/${id}`);
      return;
    }

    // Atualiza os valores da matéria
    materia.cod_materia = upCodMateria;
    materia.nome_materia = upNomeMateria;

    // Salva as alterações
    await materia.save();
    req.flash("success_msg", "Matéria editada com sucesso");
    res.redirect("/admin/materias");
  } catch (err) {
    req.flash("error_msg", "Houve um erro ao salvar a edição");
    res.redirect("/admin/materias");
  }
});

//rota que deleta a Matéria
router.get("/materias/deletar/:id", async (req, res) => {
  Materia.deleteOne({_id: req.params.id}).then(() =>{
    req.flash("success_msg", "Matéria deletada com sucesso");
    res.redirect("/admin/materias");
  }).catch((err) => {
    req.flash("error_msg", "Houve um erro interno");
    res.redirect("/admin/materias");
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
          .required()
          .messages({
            "string.empty": "Por favor, selecione uma ou mais matérias",
          })
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

//rota de edição do cursoMatéria que carrega o formulário
router.get("/cursoMaterias/editar/:id", async (req, res) =>{
  CursoMateria.findOne({_id: req.params.id}).populate("id_materia").populate("id_curso").lean().then((cursoMateria) => { 
    Promise.all([Curso.find().lean(), Materia.find().lean()])
    .then(([curso, materia]) => {
      res.render("admin/editar_cursoMaterias", { curso:curso, materia:materia, cursoMateria:cursoMateria, });
    })
    .catch((err) => {
      req.flash("error_msg", "Houve um erro ao carregar o formulário de edição");
      res.redirect("/admin/cursoMaterias");
    });

  }).catch((err) => {
    req.flash("error_msg", "Houve um erro ao carregar o formulário de edição");
    res.redirect("/admin/cursoMaterias")
  });
});

//rota de edição do cursoMatéria que salva o cursoMatéria editado - Obs : mesma validação (modularizar o JOI)
router.post("/cursoMaterias/editar", async (req, res) => {
  const id = req.body.id;
  const { id_curso, id_materia } = req.body;

  try {
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
            .required()
            .messages({
              "string.empty": "Por favor, selecione uma ou mais matérias",
            })
        )
        .messages({
          "any.required": "O campo matéria é obrigatório",
          "array.unique": "Não é permitido cadastrar matérias iguais",
        }),
    });

    const { error } = schema.validate({ id_curso, id_materia });

    if (error) {
      req.flash("error_msg", "Erro ao editar Curso-Matéria: " + error.details[0].message);
      res.redirect(`/admin/cursoMaterias/editar/${id}`);
      return;
    }

    const cursoMateria = await CursoMateria.findOne({ _id: id });

    const cursoMateriaExistente = await CursoMateria.findOne({
      _id: { $ne: id },
      id_curso: id_curso,
    }).lean();

    if (cursoMateriaExistente) {
      req.flash("error_msg", "Não é permitido cadastrar o mesmo curso novamente");
      res.redirect(`/admin/cursoMaterias/editar/${id}`);
      return;
    }

    cursoMateria.id_curso = id_curso;
    cursoMateria.id_materia = id_materia;

    await cursoMateria.save();

    req.flash("success_msg", "Curso-Matéria editado com sucesso");
    res.redirect("/admin/cursoMaterias");
  } catch (err) {
    req.flash("error_msg", "Houve um erro ao salvar a edição");
    res.redirect("/admin/cursoMaterias");
  }
});

//rota que deleta o cursoMatéria
router.get("/cursoMaterias/deletar/:id", async (req, res) => {
  CursoMateria.deleteOne({_id: req.params.id}).then(() =>{
    req.flash("success_msg", "Curso-Matéria deletado com sucesso");
    res.redirect("/admin/cursoMaterias");
  }).catch((err) => {
    req.flash("error_msg", "Houve um erro interno");
    res.redirect("/admin/cursoMaterias");
  });
});

// rota que faz a listagem dos Alunos
router.get("/alunos", async (req, res) => {
  try {
    const cursosP = Curso.find().lean().exec();
    const alunosP = Aluno.find().populate('id_curso').lean().exec();
    const [curso, alunos] = await Promise.all([cursosP, alunosP]);
    res.render('admin/alunos', {
      curso: curso,
      alunos: alunos,
    });
  } catch (err) {
    req.flash('error_msg', 'Houve um erro ao carregar os cursos e alunos');
    res.redirect('/admin');
  }
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

//rota de edição da Aluno que carrega o formulário 
router.get("/alunos/editar/:id", async (req, res) =>{
  Aluno.findOne({_id: req.params.id}).populate("id_curso").lean().then((aluno) => {
    Curso.find().lean().then((curso) => {
      res.render("admin/editar_alunos", { curso:curso, aluno:aluno });
    }).catch((err) => {
      req.flash("error_msg", "Houve um erro ao listar os cursos");
      res.redirect("/admin/alunos")
    });
  }).catch((err) => {
    req.flash("error_msg", "Houve um erro ao carregar o formulário de edição");
    res.redirect("/admin/alunos")
  });
});

//rota de edição do Aluno que salva o aluno editado - Obs : mesma validação (modularizar o JOI)
router.post("/alunos/editar", async (req, res) => {
  const id = req.body.id;
  const edicaoAluno = {
    ra: req.body.ra,
    nome_completo: req.body.nome_completo,
    semestre: req.body.semestre,
    grupo: req.body.grupo,
    turma: req.body.turma,
    lab: req.body.lab,
    email: req.body.email,
    id_curso: req.body.id_curso,
  };

  try {
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
      id_curso: Joi.string().required().messages({
        "any.required": "O campo curso do aluno é obrigatório",
        "string.empty": "Por favor, selecione um curso",
      }),
    });

    const { error } = schema.validate(edicaoAluno);
    if (error) {
      req.flash("error_msg", "Erro ao editar Aluno: " + error.details[0].message);
      res.redirect(`/admin/alunos/editar/${id}`);
      return;
    }

    
    // Verifica se já existe algum aluno cadastrado com o mesmo RA
    const alunoExistente = await Aluno.findOne({ ra: edicaoAluno.ra });
    if (alunoExistente && alunoExistente._id != id) {
      req.flash("error_msg", "Já existe um aluno cadastrado com este RA");
      res.redirect(`/admin/alunos/editar/${id}`);
      return;
    }

    const aluno = await Aluno.findOne({ _id: id });

    aluno.ra = edicaoAluno.ra;
    aluno.nome_completo = edicaoAluno.nome_completo;
    aluno.semestre = edicaoAluno.semestre;
    aluno.grupo = edicaoAluno.grupo;
    aluno.turma = edicaoAluno.turma;
    aluno.lab = edicaoAluno.lab;
    aluno.email = edicaoAluno.email;
    aluno.id_curso = edicaoAluno.id_curso;
    
    await aluno.save();

    req.flash("success_msg", "Aluno editado com sucesso");
    res.redirect("/admin/alunos");
  } catch (err) {
    req.flash("error_msg", "Houve um erro ao salvar a edição");
    res.redirect("/admin/alunos");
  }
});

//rota que deleta o Curso
router.get("/alunos/deletar/:id", async (req, res) => {
  Aluno.deleteOne({_id: req.params.id}).then(() =>{
    req.flash("success_msg", "Aluno deletado com sucesso");
    res.redirect("/admin/alunos");
  }).catch((err) => {
    req.flash("error_msg", "Houve um erro interno");
    res.redirect("/admin/alunos");
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
          .required()
          .messages({
            "string.empty": "Por favor, selecione uma ou mais matérias",
          })
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

//rota de edição do alunoMatéria que carrega o formulário
router.get("/alunoMaterias/editar/:id", async (req, res) =>{
  AlunoMateria.findOne({_id: req.params.id}).populate("id_materia").populate("id_aluno").lean().then((alunoMateria) => { 
    Promise.all([Aluno.find().lean(), Materia.find().lean()])
    .then(([aluno, materia]) => {
      res.render("admin/editar_alunoMaterias", { aluno:aluno, materia:materia, alunoMateria:alunoMateria, });
    })
    .catch((err) => {
      req.flash("error_msg", "Houve um erro ao carregar o formulário de edição");
      res.redirect("/admin/alunoMaterias");
    });

  }).catch((err) => {
    req.flash("error_msg", "Houve um erro ao carregar o formulário de edição");
    res.redirect("/admin/alunoMaterias")
  });
});

//rota de edição do alunoMatéria que salva o alunoMatéria editado - Obs : mesma validação (modularizar o JOI)
router.post("/alunoMaterias/editar", async (req, res) => {
  const id = req.body.id;
  const { id_aluno, id_materia } = req.body;

  try {
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
            .required()
            .messages({
              "string.empty": "Por favor, selecione uma ou mais matérias",
            })
        )
        .messages({
          "any.required": "O campo matéria é obrigatório",
          "array.unique": "Não é permitido cadastrar matérias iguais",
        }),
    });

    const { error } = schema.validate({ id_aluno, id_materia });

    if (error) {
      req.flash("error_msg", "Erro ao editar Aluno-Matéria: " + error.details[0].message);
      res.redirect(`/admin/alunoMaterias/editar/${id}`);
      return;
    }

    const alunoMateria = await AlunoMateria.findOne({ _id: id });

    const alunoMateriaExistente = await AlunoMateria.findOne({
      _id: { $ne: id },
      id_aluno: id_aluno,
    }).lean();

    if (alunoMateriaExistente) {
      req.flash("error_msg", "Não é permitido cadastrar o mesmo aluno novamente");
      res.redirect(`/admin/alunoMaterias/editar/${id}`);
      return;
    }

    alunoMateria.id_aluno = id_aluno;
    alunoMateria.id_materia = id_materia;

    await alunoMateria.save();

    req.flash("success_msg", "Aluno-Matéria editado com sucesso");
    res.redirect("/admin/alunoMaterias");
  } catch (err) {
    req.flash("error_msg", "Houve um erro ao salvar a edição");
    res.redirect("/admin/alunoMaterias");
  }
});

//rota que deleta o alunoMatéria
router.get("/alunoMaterias/deletar/:id", async (req, res) => {
  AlunoMateria.deleteOne({_id: req.params.id}).then(() =>{
    req.flash("success_msg", "Aluno-Matéria deletado com sucesso");
    res.redirect("/admin/alunoMaterias");
  }).catch((err) => {
    req.flash("error_msg", "Houve um erro interno");
    res.redirect("/admin/alunoMaterias");
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

//rota de edição do Professor que carrega o formulário 
router.get("/professores/editar/:id", async (req, res) =>{
  Professor.findOne({_id: req.params.id}).lean().then((professor) => {
    res.render("admin/editar_professores", {professor:professor});
  }).catch((err) => {
    req.flash("error_msg", "Houve um erro ao carregar o formulário de edição");
    res.redirect("/admin/professores")
  });
});

//rota de edição do Professor que salva o professor editado - Obs : mesma validação (modularizar o JOI)
router.post("/professores/editar", async (req, res) => {
  const id = req.body.id;
  const edicaoProfessor = {
    ra: req.body.ra,
    nome_completo: req.body.nome_completo,
    email: req.body.email,
  };

  try {
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
    });

    const { error } = schema.validate(edicaoProfessor);
    if (error) {
      req.flash("error_msg", "Erro ao editar Professor: " + error.details[0].message);
      res.redirect(`/admin/professores/editar/${id}`);
      return;
    }

    // Verifica se já existe algum professor cadastrado com o mesmo RA
    const professorExistente = await Professor.findOne({ ra: edicaoProfessor.ra });
    if (professorExistente && professorExistente._id != id) {
      req.flash("error_msg", "Já existe um professor cadastrado com este RA");
      res.redirect(`/admin/professores/editar/${id}`);
      return;
    }

    const professor = await Professor.findOne({ _id: id });

    professor.ra = edicaoProfessor.ra;
    professor.nome_completo = edicaoProfessor.nome_completo;
    professor.email = edicaoProfessor.email;
    
    await professor.save();

    req.flash("success_msg", "Professor editado com sucesso");
    res.redirect("/admin/professores");
  } catch (err) {
    req.flash("error_msg", "Houve um erro ao salvar a edição");
    res.redirect("/admin/professores");
  }
});

//rota que deleta o Professor
router.get("/professores/deletar/:id", async (req, res) => {
  Professor.deleteOne({_id: req.params.id}).then(() =>{
    req.flash("success_msg", "Professor deletado com sucesso");
    res.redirect("/admin/professores");
  }).catch((err) => {
    req.flash("error_msg", "Houve um erro interno");
    res.redirect("/admin/professores");
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
    enum_aula: req.body.enum_aula,
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
    enum_aula: Joi.string().valid("Padrão", "Pae").required().messages({
      "any.required": "O campo categoria da aula é obrigatório",
      "string.empty": "Por favor, selecione uma categoria de aula",
      "any.only": "A categoria da aula deve ser Padrão ou Pae",
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

//rota de edição da aula que carrega o formulário
router.get("/aulas/editar/:id", async (req, res) =>{
  Aula.findOne({_id: req.params.id}).populate("id_materia").populate("id_professor").lean().then((aula) => { 
    Promise.all([Professor.find().lean(), Materia.find().lean()])
    .then(([professor, materia]) => {
      res.render("admin/editar_aulas", { professor:professor, materia:materia, aula:aula, });
    })
    .catch((err) => {
      req.flash("error_msg", "Houve um erro ao carregar o formulário de edição");
      res.redirect("/admin/aulas");
    });

  }).catch((err) => {
    req.flash("error_msg", "Houve um erro ao carregar o formulário de edição");
    res.redirect("/admin/aulas")
  });
});

//rota de edição da Aula que salva a aula editada - Obs : mesma validação (modularizar o JOI)
router.post("/aulas/editar", async (req, res) => {
  const id = req.body.id;
  const edicaoAula = {
    horario_inicio: req.body.horario_inicio,
    horario_fim: req.body.horario_fim,
    tipo_aula: req.body.tipo_aula,
    enum_aula: req.body.enum_aula,
    id_materia: req.body.id_materia,
    id_professor: req.body.id_professor,
    dia_semana: req.body.dia_semana,
    sala: req.body.sala,
    grupo: req.body.grupo,
    turma: req.body.turma,
    lab: req.body.lab,
  };

  try {
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
      enum_aula: Joi.string().valid("Padrão", "Pae").required().messages({
        "any.required": "O campo categoria da aula é obrigatório",
        "string.empty": "Por favor, selecione uma categoria de aula",
        "any.only": "A categoria da aula deve ser Padrão ou Pae",
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


    const { error } = schema.validate(edicaoAula);
    if (error) {
      req.flash("error_msg", "Erro ao editar Aula: " + error.details[0].message);
      res.redirect(`/admin/aulas/editar/${id}`);
      return;
    }

    const aula = await Aula.findOne({ _id: id });

    aula.horario_inicio = edicaoAula.horario_inicio;
    aula.horario_fim = edicaoAula.horario_fim;
    aula.tipo_aula = edicaoAula.tipo_aula;
    aula.enum_aula = edicaoAula.enum_aula;
    aula.id_materia = edicaoAula.id_materia;
    aula.id_professor = edicaoAula.id_professor;
    aula.dia_semana = edicaoAula.dia_semana;
    aula.sala = edicaoAula.sala;
    aula.grupo = edicaoAula.grupo;
    aula.turma = edicaoAula.turma
    aula.lab = edicaoAula.lab;
    
    await aula.save();

    req.flash("success_msg", "Aula editada com sucesso");
    res.redirect("/admin/aulas");
  } catch (err) {
    req.flash("error_msg", "Houve um erro ao salvar a edição");
    res.redirect("/admin/aulas");
  }
});

//rota que deleta a Aula
router.get("/aulas/deletar/:id", async (req, res) => {
  Aula.deleteOne({_id: req.params.id}).then(() =>{
    req.flash("success_msg", "Aula deletada com sucesso");
    res.redirect("/admin/aulas");
  }).catch((err) => {
    req.flash("error_msg", "Houve um erro interno");
    res.redirect("/admin/aulas");
  });
});

// rota que faz a listagem das Presenças
router.get("/presencas", async (req, res) => {
  Presenca.find().populate("id_aula").populate("alunos.id_aluno").populate({ path: "id_aula", populate: { path: "id_materia" } }).populate({ path: "id_aula", populate: { path: "id_professor" } }).populate({ path: "alunos.id_aluno", populate: { path: "id_curso" } }).lean().then((presencas) => {
    res.render("admin/presencas", {presencas:presencas});
  }).catch((err) => {
    req.flash("error_msg","Houve um errro ao listar as presenças");
    console.error(err);
    res.redirect("/admin");
  });
});

// rota de edição da Presença
router.get("/presencas/editar/:id", async (req, res) =>{
});

module.exports = router;
