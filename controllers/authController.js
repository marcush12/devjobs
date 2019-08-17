const passport = require('passport');
const mongoose = require('mongoose');
const Vacante = mongoose.model('Vacante');
const Usuarios = mongoose.model('Usuarios');
const crypto = require('crypto');//crypto faz parte do node
const enviarEmail = require('../handlers/email');

exports.autenticarUsuario = passport.authenticate('local', {
  successRedirect: '/administracion',
  failureRedirect: '/iniciar-sesion',
  failureFlash: true,
  badRequestMessage: 'Os dois campos dever ser preenchidos'
})

// verificar se usuario está ou ñ autenticado //
exports.verificarUsuario = (req, res, next) => {
  // verificar usuario //
  if(req.isAuthenticated()) {// method de passport
    return next();// tudo ok
  }
  // ñ esta autenticado: redirecionar //
  res.redirect('/iniciar-sesion');

}

exports.mostrarPanel = async (req, res) => {
  // consultar usuario autenticado //
  const vacantes = await Vacante.find({autor: req.user._id});
  res.render('administracion', {
    nombrePagina: 'Painel Administrativo',
    tagline: 'Crie e Administre suas vagas aqui',
    cerrarSesion: true,
    nombre: req.user.nombre,
    imagen: req.user.imagen,
    vacantes
  })
}

exports.cerrarSesion = (req, res) => {
  req.logout();
  req.flash('correcto', 'Sessão encerrada')
  return res.redirect('/iniciar-sesion');
}

// formulario p reiniciar a senha
exports.formReestablecerPassword = (req, res) => {
  res.render('reestablecer-password', {
    nombrePagina: 'Recuperar Senha',
    tagline: 'Se já tem conta e esqueceu sua senha, insira seu email'
  })
}

// gerar token na tabela do usuario //
exports.enviarToken = async (req, res) => {
  const usuario = await Usuarios.findOne({ email: req.body.email });
  if(!usuario) {
    req.flash('error', 'Esse email não existe');
    return res.redirect('/iniciar-sesion');
  }
  // usuario existe, gerar token //
  usuario.token = crypto.randomBytes(20).toString('hex');
  usuario.expira = Date.now() + 36000000;

  // salvar o usuario //
  await usuario.save();
  const resetUrl = `http://${req.headers.host}/reestablecer-password/${usuario.token}`;

  //console.log(resetUrl);

  // enviar notificação por email //
  await enviarEmail.enviar({
    usuario,
    subject: "Recuperação de Senha",
    resetUrl,
    archivo: 'reset'
  })
  

  req.flash('correcto', 'Verifique seu email para mais informações')
  res.redirect('/iniciar-sesion');
}

// verifica se o token é valido e usuario existe, mostra a vista //
exports.reestablecerPassword = async (req, res) => {
  const usuario = await Usuarios.findOne({
      token : req.params.token,
      expira: {
        $gt: Date.now()
      }
  });

  if(!usuario) {
      req.flash('error', 'O formulario não é mais válido, tente outra vez.');
      return res.redirect('/reestablecer-password');
  }

  // Todo bien, mostrar el formulario
  res.render('nuevo-password', {
      nombrePagina : 'Nova Senha'
  })
}

// almacena el nuevo password en la BD
exports.guardarPassword = async (req, res) => {
  const usuario = await Usuarios.findOne({
      token : req.params.token
  });

  // no existe el usuario o el token es invalido
  if(!usuario) {
      req.flash('error', 'O formulario não é mais valido, tente outra vez');
      return res.redirect('/reestablecer-password');
  }

  // Asignar nuevo password, limpiar valores previos
  usuario.password = req.body.password;
  usuario.token = undefined;
  usuario.expira = undefined;

  // agregar y eliminar valores del objeto
  await usuario.save();

  // redirigir
  req.flash('correcto', 'Senha alterada com sucesso!');
  res.redirect('/iniciar-sesion');
}