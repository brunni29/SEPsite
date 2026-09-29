const express = require('express');

const {
  listarAgendamentos,
  cadastrarAgendamento,
  atualizarAgendamento,
  excluirAgendamento
} = require('../controllers/agendamentoController');

const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, listarAgendamentos);

router.post('/', auth, cadastrarAgendamento);

router.put('/:id', auth, atualizarAgendamento);

router.delete('/:id', auth, excluirAgendamento);

module.exports = router;