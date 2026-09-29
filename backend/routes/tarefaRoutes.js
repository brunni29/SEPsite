const express = require("express");
const autenticar = require("../middleware/auth");
const permitir = require("../middleware/permissao");

const {
    createTask,
    getTasks,
    updateTask,
    deleteTask
} = require("../controllers/tarefaController");

const router = express.Router();

router.get("/", autenticar, getTasks);

router.post(
    "/",
    autenticar,
    permitir("administrador", "diretor", "mobilizador"),
    createTask
);

router.put("/:id", autenticar, updateTask);

router.delete(
    "/:id",
    autenticar,
    permitir("administrador", "diretor", "mobilizador"),
    deleteTask
);

module.exports = router;
