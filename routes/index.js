const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');
const vacantesController = require('../controllers/vacantesController');
const usuariosController = require('../controllers/usuariosController');
const authController = require('../controllers/authController');

module.exports = () => {
  router.get('/', homeController.mostrarTrabajos);

  // criar vagas //
  router.get(
    '/vacantes/nueva',
    authController.verificarUsuario,
    vacantesController.formularioNuevaVacante
  );

  router.post(
    '/vacantes/nueva',
    authController.verificarUsuario,
    vacantesController.validarVacante,
    vacantesController.agregarVacante
  );

  // mostrar vagas- mostrar vacante (singular) //
  router.get('/vacantes/:url', vacantesController.mostrarVacante);

  // editar vaga //
  router.get(
    '/vacantes/editar/:url',
    authController.verificarUsuario,
    vacantesController.formEditarVacante
  );
  router.post(
    '/vacantes/editar/:url',
    authController.verificarUsuario,
    vacantesController.validarVacante,
    vacantesController.editarVacante
  );

  // eliminar vacante //
  router.delete('/vacantes/eliminar/:id', vacantesController.eliminarVacante);

  // criar conta //
  router.get('/crear-cuenta', usuariosController.formCrearCuenta);
  router.post(
    '/crear-cuenta',
    usuariosController.validarRegistro,
    usuariosController.crearUsuario
  );

  // autenticar usuarios //
  router.get('/iniciar-sesion', usuariosController.formIniciarSesion);
  router.post('/iniciar-sesion', authController.autenticarUsuario);
  // fechar sessão //
  router.get(
    '/cerrar-sesion',
    authController.verificarUsuario,
    authController.cerrarSesion
  );
  // reset senha - esqueci a senha(emails) //
  router.get('/reestablecer-password', authController.formReestablecerPassword);
    router.post('/reestablecer-password', authController.enviarToken);

  // Resetear Password ( Almacenar en la BD )
  router.get('/reestablecer-password/:token', authController.reestablecerPassword);
  router.post('/reestablecer-password/:token', authController.guardarPassword);


  // painel administrativo //
  router.get(
    '/administracion',
    authController.verificarUsuario,
    authController.mostrarPanel
  );

  // editar perfil //
  router.get(
    '/editar-perfil',
    authController.verificarUsuario,
    usuariosController.formEditarPerfil
  );

  router.post(
    '/editar-perfil',
    authController.verificarUsuario,
    // usuariosController.validarPerfil,
    usuariosController.subirImagen,
    usuariosController.editarPerfil
  );

  // receber mensagens de candidatos //
  router.post(
    '/vacantes/:url',
    vacantesController.subirCV,
    vacantesController.contactar
  );

  // mostrar candidatos por vagas //
  router.get(
    '/candidatos/:id',
    authController.verificarUsuario,
    vacantesController.mostrarCandidatos
  );

  // buscador de vagas //
  router.post('/buscador', vacantesController.buscarVacantes)

  return router; //sem isto ñ funciona
};
