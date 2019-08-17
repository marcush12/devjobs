const mongoose = require('mongoose');
const Vacante = mongoose.model('Vacante');

const multer = require('multer');
const shortid = require('shortid');

exports.formularioNuevaVacante = (req, res) => {
  res.render('nueva-vacante', {
    nombrePagina: 'Nova vaga',
    tagline: 'Preencha o formulario e publique sua vaga',
    cerrarSesion: true,
    nombre: req.user.nombre,
    imagen: req.user.imagen
  });
};

// agregar as vagas à base de datos
exports.agregarVacante = async (req, res) => {
  const vacante = new Vacante(req.body);

  // usuario autor da vaga //
  vacante.autor = req.user._id;

  // criar array de skills //
  vacante.skills = req.body.skills.split(',');

  // armazenar na base de dados //
  const nuevaVacante = await vacante.save();

  // redirecionar //
  res.redirect(`/vacantes/${nuevaVacante.url}`);
};

// mostrar uma vacante //
exports.mostrarVacante = async (req, res, next) => {
  const vacante = await Vacante.findOne({ url: req.params.url }).populate(
    'autor'
  );
  // si no hay resultados
  if (!vacante) return next();

  res.render('vacante', {
    vacante,
    nombrePagina: vacante.titulo,
    barra: true
  });
};

exports.formEditarVacante = async (req, res, next) => {
  const vacante = await Vacante.findOne({ url: req.params.url });

  if (!vacante) return next();
  res.render('editar-vacante', {
    vacante,
    nombrePagina: `Editar ${vacante.titulo}`,
    cerrarSesion: true,
    nombre: req.user.nombre,
    imagen: req.user.imagen
  });
};

exports.editarVacante = async (req, res) => {
  const vacanteActualizada = req.body;
  vacanteActualizada.skills = req.body.skills.split(',');

  const vacante = await Vacante.findOneAndUpdate(
    { url: req.params.url },
    vacanteActualizada,
    {
      new: true,
      runValidators: true
    }
  );

  res.redirect(`/vacantes/${vacante.url}`);
};

// validar e sanitizar os campos das novas vagas //
exports.validarVacante = (req, res, next) => {
  // sanitizar campos //
  req.sanitizeBody('titulo').escape();
  req.sanitizeBody('empresa').escape();
  req.sanitizeBody('ubicacion').escape();
  req.sanitizeBody('salario').escape();
  req.sanitizeBody('contrato').escape();
  req.sanitizeBody('skills').escape();

  // validar //
  req.checkBody('titulo', 'Escreva o título da vaga').notEmpty();
  req.checkBody('empresa', 'Escreva o nome de sua empresa').notEmpty();
  req.checkBody('ubicacion', 'Escreva a localização').notEmpty();
  req.checkBody('contrato', 'Escolha o tipo de contrato').notEmpty();
  req.checkBody('skills', 'Adicione pelo menos uma habilidade').notEmpty();

  const errores = req.validationErrors();

  if (errores) {
    // recarregar a vista com os erros //
    req.flash('error', errores.map(error => error.msg));

    res.render('nueva-vacante', {
      nombrePagina: 'Nova vaga',
      tagline: 'Preencha o formulario e publique sua vaga',
      cerrarSesion: true,
      nombre: req.user.nombre,
      mensajes: req.flash()
    });
  }

  next(); // seguinte middleware
};

exports.eliminarVacante = async (req, res) => {
  const { id } = req.params;
  const vacante = await Vacante.findById(id);

  if (verificarAutor(vacante, req.user)) {
    // tudo ok: eliminar se é o autor //
    vacante.remove();
    res.status(200).send('Vaga foi eliminada com sucesso');
  } else {
    // ñ permitido //
    res.status(403).send('Error');
  }
};

const verificarAutor = (vacante = {}, usuario = {}) => {
  if (!vacante.autor.equals(usuario._id)) {
    return false;
  }
  return true;
};

// subir arquivo em pdf //
exports.subirCV = (req, res, next) => {
  upload(req, res, function(error) {
    if (error) {
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          req.flash('error', 'A imagem não pode ser maior que 100Kb');
        } else {
          req.flash('error', error.message);
        }
      } else {
        req.flash('error', error.message);
      }
      res.redirect('back');
      return;
    } else {
      return next();
    }
  });
};

// opções de multer //
const configuracionMulter = {
  limits: { fileSize: 100000 },
  storage: (fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      //cb callback or next
      cb(null, __dirname + '../../public/uploads/cv'); //null for error
    },
    filename: (req, file, cb) => {
      const extension = file.mimetype.split('/')[1]; //descobrir c clg imagen/jpg split cria array e queremos [1]
      cb(null, `${shortid.generate()}.${extension}`);
    }
  })),
  fileFilter(req, file, cb) {
    if (file.mimetype === 'application/pdf') {
      // cb executa como true or false //
      cb(null, true);
    } else {
      cb(new Error('Formato não válido'), false);
    }
  }
};

const upload = multer(configuracionMulter).single('cv');

// salvar os candidato na base de dados //
exports.contactar = async (req, res, next) => {
  const vacante = await Vacante.findOne({ url: req.params.url });
  // se não existe a vaga //
  if (!vacante) return next();
  // está tudo ok, constroi novo objeto //
  const nuevoCandidato = {
    nombre: req.body.nombre,
    email: req.body.email,
    cv: req.file.filename
  };
  // armazenar a vaga //
  vacante.candidatos.push(nuevoCandidato);
  await vacante.save();

  // mensagem flash e redirecionar //
  req.flash('correcto', 'Seu currículo foi enviado com sucesso');
  res.redirect('/'); //pag inicial //
};

exports.mostrarCandidatos = async (req, res, next) => {
  const vacante = await Vacante.findById(req.params.id);
  if (vacante.autor != req.user._id.toString()) {
    return next();
  }

  if (!vacante) return next();

  res.render('candidatos', {
    nombrePagina: `Candidatos - Vaga - ${vacante.titulo}`,
    cerrarSesion: true,
    nombre: req.user.nombre,
    imagen: req.user.imagen,
    candidatos: vacante.candidatos
  });
};

// buscador de vagas //
exports.buscarVacantes = async (req, res) => {
  const vacantes = await Vacante.find({
    $text: {//metodos do mongo
      $search : req.body.q
    }
  })
  // mostrar as vagas //
  res.render('home', {
    nombrePagina: `Resultados da sua busca: ${req.body.q}`,
    barra: true,
    vacantes
  })
}
