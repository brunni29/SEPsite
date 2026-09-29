const express = require("express");
const autenticar = require("../middleware/auth");
const permitir = require("../middleware/permissao");

const {
    listarCategorias,
    criarCategoria,
    atualizarCategoria,
    excluirCategoria,
    listarProjetos,
    buscarProjeto,
    criarProjeto,
    atualizarProjeto,
    excluirProjeto,
    monitorarProjeto
} = require("../controllers/projetoController");

const router = express.Router();
const gestores = ["administrador", "diretor", "mobilizador"];

router.get("/categorias", autenticar, permitir(...gestores), listarCategorias);
router.post("/categorias", autenticar, permitir(...gestores), criarCategoria);
router.put("/categorias/:id", autenticar, permitir(...gestores), atualizarCategoria);
router.delete("/categorias/:id", autenticar, permitir(...gestores), excluirCategoria);

router.get("/", autenticar, permitir(...gestores), listarProjetos);
router.get("/:id/monitoramento", autenticar, permitir(...gestores), monitorarProjeto);
router.get("/:id", autenticar, permitir(...gestores), buscarProjeto);
router.post("/", autenticar, permitir(...gestores), criarProjeto);
router.put("/:id", autenticar, permitir(...gestores), atualizarProjeto);
router.delete("/:id", autenticar, permitir(...gestores), excluirProjeto);

module.exports = router;
