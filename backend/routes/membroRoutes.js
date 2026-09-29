const express = require("express");

const autenticar = require("../middleware/auth");
const permitir = require("../middleware/permissao");

const {
    listarMembros,
    buscarMembroPorId,
    cadastrarMembro,
    atualizarMembro,
    excluirMembro
} = require("../controllers/membroController");

const router = express.Router();

router.get(
    "/",
    autenticar,
    permitir("administrador", "diretor", "mobilizador"),
    listarMembros
);

router.get(
    "/:id",
    autenticar,
    permitir("administrador", "diretor", "mobilizador"),
    buscarMembroPorId
);

router.post(
    "/",
    autenticar,
    permitir("administrador", "diretor", "mobilizador"),
    cadastrarMembro
);

router.put(
    "/:id",
    autenticar,
    permitir("administrador", "diretor", "mobilizador"),
    atualizarMembro
);

router.delete(
    "/:id",
    autenticar,
    permitir("administrador", "diretor", "mobilizador"),
    excluirMembro
);

module.exports = router;