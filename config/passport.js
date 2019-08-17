const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const Usuarios = mongoose.model('Usuarios');

passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password'
    },
    async (email, password, done) => {
      //done is like next
      const usuario = await Usuarios.findOne({ email });
      if (!usuario)
        return done(null, false, {
          message: 'Usuário não existe'
        });
      //usuario existe, verficar a senha
      const verificarPass = usuario.compararPassword(password);
      if (!verificarPass)
        return done(null, false, {
          message: 'Senha incorreta'
        });

      // usuario existe e senha está correta //
      return done(null, usuario);
    }
  )
);

passport.serializeUser((usuario, done) => done(null, usuario._id));

passport.deserializeUser(async (id, done) => {
  const usuario = await Usuarios.findById(id).exec();
  return done(null, usuario);
})

module.exports = passport;
