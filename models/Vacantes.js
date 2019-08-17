const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slug');
const shortid = require('shortid'); 

const vacantesSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: 'O nome da vaga é obrigatório', 
    trim: true
  },
  empresa: {
    type: String, 
    trim: true
  },
  ubicacion: {
    type: String,
    required: 'A localização da vaga é obrigatório', 
    trim: true
  },
  salario: {
    type: String,
    default: 0,
    trim: true
  },
  contrato: {
        type: String,
        trim: true
    },
    descripcion: {
      type: String,
      trim: true
  },
    url : {
        type: String,
        lowercase:true
    },
    skills: [String],
    candidatos: [{
        nombre: String,
        email: String,
        cv : String
  }],
  autor: {
    type: mongoose.Schema.ObjectId,
    ref: 'Usuarios',
    required: 'Autor não pode ficar em branco'
  }  
});

vacantesSchema.pre('save', function(next) {
  // criar a URL //
  const url = slug(this.titulo);
  this.url = `${url}-${shortid.generate()}`;//p.e. React Developer => react-developer-45789

  next();
})

// criar um indice, para buscador //
vacantesSchema.index({ titulo: 'text' });

module.exports = mongoose.model('Vacante', vacantesSchema);