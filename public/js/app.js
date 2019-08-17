import axios from 'axios';
import Swal from 'sweetalert2';

document.addEventListener('DOMContentLoaded', () => {
  const skills = document.querySelector('.lista-conocimientos');

  // limpar alertas = document.querySelector
  let alertas = document.querySelector('.alertas');

  if (alertas) {
    limpiarAlertas();
  }

  if (skills) {
    skills.addEventListener('click', agregarSkills);

    // se estivermos em editar, chamar a funcção //
    skillsSeleccionados();
  }

  const vacantesListado = document.querySelector('.panel-administracion');

  if (vacantesListado) {
    vacantesListado.addEventListener('click', accionesListado);
  }
});

const skills = new Set();
const agregarSkills = e => {
  if (e.target.tagName === 'LI') {
    if (e.target.classList.contains('activo')) {
      //tirar do set e tirar a classe
      skills.delete(e.target.textContent);
      e.target.classList.remove('activo'); // ver doc do set()
    } else {
      // agregar ao set e agregar a classe
      skills.add(e.target.textContent);
      e.target.classList.add('activo');
    }
  }
  const skillsArray = [...skills];
  document.querySelector('#skills').value = skillsArray;
};

const skillsSeleccionados = () => {
  const seleccionadas = Array.from(
    document.querySelectorAll('.lista-conocimientos .activo')
  );

  seleccionadas.forEach(seleccionada => {
    skills.add(seleccionada.textContent);
  });

  //injetar em hidden //
  const skillsArray = [...skills];
  document.querySelector('#skills').value = skillsArray;

  console.log(seleccionadas);
};

const limpiarAlertas = () => {
  const alertas = document.querySelector('.alertas');
  const interval = setInterval(() => {
    if (alertas.children.length > 0) {
      alertas.removeChild(alertas.children[0]);
    } else if (alertas.children.length === 0) {
      alertas.parentElement.removeChild(alertas);
      clearInterval(interval);
    }
  }, 2000);
};

// eliminar vacantes
const accionesListado = e => {
  e.preventDefault();

  if (e.target.dataset.eliminar) {
    // eliminar através de axios //

    Swal.fire({
      title: 'Tem certeza disso?',
      text: 'Esta ação não poderá ser revertida',
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sim, eliminar!',
      cancelButtonText: 'Não, cancelar.'
    }).then(result => {
      if (result.value) {
        // enviar o pedido com axios //
        const url = `${location.origin}/vacantes/eliminar/${
          e.target.dataset.eliminar
        }`;

        // axios p eliminar o registro //
        axios.delete(url, { params: { url } }).then(function(respuesta) {
          if (respuesta.status === 200) {
            Swal.fire('Eliminado!', respuesta.data, 'success');
          }
        });
        // todo: eliminar do DOM //
        e.target.parentElement.parentElement.parentElement.removeChild(e.target.parentElement.parentElement);

      }
    })
    .catch(() => {
      Swal.fire({
        type: 'error',
        title: 'Houve um erro',
        text: 'Nãofoi possível eliminar a vaga'
      })
    })
  } else if(e.target.tagName === 'A') {
    
    window.location.href = e.target.href;
  }
};
