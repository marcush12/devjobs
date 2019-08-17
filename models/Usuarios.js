const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const bcrypt = require('bcrypt');

const usuariosSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  nombre: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true,
    trim: true
  },
  token: String,
  expira: Date,
  imagen: String
});

// método p hash nas senhas //
usuariosSchema.pre('save', async function(next) {
  // se a senha já tem hash //
  if(!this.isModified('password')) {
    return next();// para a continuação
  }
  // se não tem a hash
  const hash = await bcrypt.hash(this.password, 12);
  this.password = hash;
  next();
});
// enviar alerta quando um usuario já está registrado
usuariosSchema.post('save', function(error, doc, next) {
  if(error.name === 'MongoError' && error.code === 11000){
    next('Esse email já está registrado aqui');
  } else {
    next(error);
  }
});
// autenticar usuarios //
usuariosSchema.methods = {
  compararPassword: function(password) {
    return bcrypt.compareSync(password, this.password);
  }
}


module.exports = mongoose.model('Usuarios', usuariosSchema);