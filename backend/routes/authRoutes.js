const express = require("express");
const { cadastrar, login, solicitarRecuperacao, redefinirSenha } = require("../controllers/authController");
const autenticar = require("../middleware/auth");
const permitir = require("../middleware/permissao");

const router = express.Router();

router.post("/cadastro", autenticar, permitir("administrador", "diretor", "mobilizador"), cadastrar);
router.post("/login", login);
router.post("/esqueci-senha", solicitarRecuperacao);
router.post("/redefinir-senha", redefinirSenha);

module.exports = router;
