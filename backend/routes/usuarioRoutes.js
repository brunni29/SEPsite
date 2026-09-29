const express = require("express");

const autenticar = require("../middleware/auth");
const permitir = require("../middleware/permissao");

const {
    listarUsuarios,
    alterarNivel,
    atualizarUsuario,
    excluirUsuario
} = require("../controllers/usuarioController");

const router = express.Router();

router.get(
    "/",
    autenticar,
    permitir("administrador", "diretor", "mobilizador"),
    listarUsuarios
);

router.put(
    "/:id",
    autenticar,
    permitir("administrador", "diretor", "mobilizador"),
    atualizarUsuario
);

router.put(
    "/:id/nivel",
    autenticar,
    permitir("administrador"),
    alterarNivel
);

router.delete(
    "/:id",
    autenticar,
    permitir("administrador", "diretor", "mobilizador"),
    excluirUsuario
);

module.exports = router;
