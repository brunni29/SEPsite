require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const usuarioRoutes = require("./routes/usuarioRoutes");
const autenticar = require("./middleware/auth");
const permitir = require("./middleware/permissao");
const agendamentoRoutes = require('./routes/agendamentoRoutes');
const membroRoutes = require("./routes/membroRoutes");
const tarefaRoutes = require("./routes/tarefaRoutes");
const projetoRoutes = require("./routes/projetoRoutes");


const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        mensagem: "API de Login e Níveis de Acesso funcionando!"
    });
});

app.use("/auth", authRoutes);
app.use("/usuarios", usuarioRoutes);
app.use('/agendamentos', agendamentoRoutes);
app.use("/membros", membroRoutes);
app.use("/tasks", tarefaRoutes);
app.use("/projetos", projetoRoutes);

app.get("/dashboard", autenticar, (req, res) => {
    res.json({
        mensagem: `Bem-vindo, ${req.usuario.nome}!`,
        nivel_acesso: req.usuario.nivel_acesso
    });
});

app.get(
    "/area/diretor",
    autenticar,
    permitir("administrador", "diretor"),
    (req, res) => {
        res.json({
            mensagem: "Área da diretoria liberada."
        });
    }
);

app.get(
    "/area/mobilizador",
    autenticar,
    permitir("administrador", "diretor", "mobilizador"),
    (req, res) => {
        res.json({
            mensagem: "Área de mobilização liberada."
        });
    }
);

app.get(
    "/area/membro",
    autenticar,
    permitir(
        "administrador",
        "diretor",
        "mobilizador",
        "membro"
    ),
    (req, res) => {
        res.json({
            mensagem: "Área de membro liberada."
        });
    }
);

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
