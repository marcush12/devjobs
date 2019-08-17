const mongoose = require('mongoose');
const Usuarios = mongoose.model('Usuarios');
const multer = require('multer');
const shortid = require('shortid');

exports.subirImagen = (req, res, next) => {
  upload(req, res, function(error) {
    if (error) {
      if (error instanceof multer.MulterError) {
        if(error.code === 'LIMIT_FILE_SIZE') {
          req.flash('error', 'A imagem não pode ser maior que 100Kb');
        } else {
          req.flash('error', error.message);
        }
      } else {
        req.flash('error', error.message);
      }
      res.redirect('/administracion');
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
      cb(null, __dirname + '../../public/uploads/perfiles'); //null for error
    },
    filename: (req, file, cb) => {
      const extension = file.mimetype.split('/')[1]; //descobrir c clg imagen/jpg split cria array e queremos [1]
      cb(null, `${shortid.generate()}.${extension}`);
    }
  })),
  fileFilter(req, file, cb) {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      // cb executa como true or false //
      cb(null, true);
    } else {
      cb(new Error('Formato não válido'), false);
    }
  }
};

const upload = multer(configuracionMulter).single('imagen');

exports.formCrearCuenta = (req, res) => {
  res.render('crear-cuenta', {
    nombrePagina: 'Crie sua conta em DevJobs',
    tagline: 'Publique gratuitamente suas vagas'
  });
};

exports.validarRegistro = (req, res, next) => {
  // sanitizar campos //
  req.sanitizeBody('nombre').escape();
  req.sanitizeBody('email').escape();
  req.sanitizeBody('password').escape();
  req.sanitizeBody('confirmar').escape();

  // validar //
  req.checkBody('nombre', 'Nome é obrigatório').notEmpty();
  req.checkBody('email', 'Email deve ser um email válido').isEmail();
  req.checkBody('password', 'A senha não pode ficar em branco').notEmpty();
  req
    .checkBody('confirmar', 'Confirmar senha não pode ficar em branco')
    .notEmpty();
  req
    .checkBody('confirmar', 'As senhas não são iguais')
    .equals(req.body.password);

  const errores = req.validationErrors();

  //console.log(errores);

  if (errores) {
    //se houver erros //
    //console.log(errores)
    req.flash('error', errores.map(error => error.msg));

    res.render('crear-cuenta', {
      nombrePagina: 'Crie sua conta em DevJobs',
      tagline: 'Publique gratuitamente suas vagas',
      mensajes: req.flash()
    });
    return;
  }
  // se toda a validação está correta (sem erros) //
  next();

  return;
};

exports.crearUsuario = async (req, res, next) => {
  // criar o usuario //
  const usuario = new Usuarios(req.body);

  try {
    await usuario.save();
    res.redirect('/iniciar-sesion');
  } catch (error) {
    req.flash('error', error);
    res.redirect('/crear-cuenta');
  }
};

// fomulário p iniciar sessão //
exports.formIniciarSesion = (req, res) => {
  res.render('iniciar-sesion', {
    nombrePagina: 'Iniciar Sessão devJobs'
  }); //manda chamar a vista
};

// form editar o perfil //
exports.formEditarPerfil = (req, res) => {
  res.render('editar-perfil', {
    nombrePagina: 'Edite seu perfil',
    usuario: req.user,
    cerrarSesion: true,
    nombre: req.user.nombre,
    imagen: req.user.imagen
  });
};

// guardar cambios editar perfil //
exports.editarPerfil = async (req, res) => {
  const usuario = await Usuarios.findById(req.user._id);

  usuario.nombre = req.body.nombre;
  usuario.email = req.body.email;
  if (req.body.password) {
    usuario.password = req.body.password;
  }

  if (req.file) {
    usuario.imagen = req.file.filename; //se estiver vazio não faz nada
  }

  await usuario.save();

  req.flash('correcto', 'Atualizado com sucesso');

  // redirect //
  res.redirect('/administracion');
};

// sanitizar e validar formulario de editar perfil //
exports.validarPerfil = (req, res, next) => {
  // sanitizar //
  req.sanitizeBody('nombre').escape();
  req.sanitizeBody('email').escape();
  if (req.body.password) {
    //caso mude a senha
    req.sanitizeBody('password').escape();
  }
  // validar //
  req.checkBody('nombre', 'Campo do nome não pode ficar em branco').notEmpty();
  req.checkBody('nombre', 'Campo do email não pode ficar em branco').notEmpty();

  const errores = req.validationErrors();

  if (errores) {
    req.flash('error', errores.map(error => error.msg));
    res.render('editar-perfil', {
      nombrePagina: 'Edite seu perfil',
      usuario: req.user,
      cerrarSesion: true,
      nombre: req.user.nombre,
      imagen: req.user.imagen,
      mensajes: req.flash()
    });
  }
  next(); // tudo em ordem, seguinte middleware //
};
