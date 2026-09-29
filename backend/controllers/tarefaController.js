const db = require("../db/conexao");

const niveisGestao = ["administrador", "diretor", "mobilizador"];

function sincronizarStatusProgresso(status, progresso) {
    let statusFinal = status || "Pendente";
    let progressoFinal = progresso === undefined || progresso === "" ? 0 : Number(progresso);

    if (statusFinal === "Concluído") {
        progressoFinal = 100;
    } else if (progressoFinal === 100) {
        statusFinal = "Concluído";
    }

    return {
        status: statusFinal,
        progresso: progressoFinal
    };
}

async function createTask(req, res) {
    try {
        const {
            title,
            description,
            deadline,
            status,
            responsavel_id,
            prioridade,
            progresso
        } = req.body;

        if (!title || title.trim().length < 3) {
            return res.status(400).json({
                mensagem: "O título deve possuir no mínimo 3 caracteres."
            });
        }

        if (responsavel_id) {
            const [usuario] = await db.query(
                "SELECT id_usuario FROM usuarios WHERE id_usuario = ?",
                [responsavel_id]
            );

            if (usuario.length === 0) {
                return res.status(400).json({
                    mensagem: "Responsável não encontrado."
                });
            }
        }

        const porcentagem =
            progresso === undefined || progresso === ""
                ? 0
                : Number(progresso);

        if (
            Number.isNaN(porcentagem) ||
            porcentagem < 0 ||
            porcentagem > 100
        ) {
            return res.status(400).json({
                mensagem: "O progresso deve estar entre 0 e 100."
            });
        }

        const sincronizado = sincronizarStatusProgresso(
            status || "Pendente",
            porcentagem
        );

        const [resultado] = await db.query(
            `INSERT INTO tasks
            (
                title,
                description,
                deadline,
                status,
                responsavel_id,
                prioridade,
                progresso
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                title.trim(),
                description || null,
                deadline || null,
                sincronizado.status,
                responsavel_id || null,
                prioridade || "Média",
                sincronizado.progresso
            ]
        );

        res.status(201).json({
            mensagem: "Tarefa criada com sucesso!",
            id: resultado.insertId
        });

    } catch (erro) {
        console.error("Erro ao criar tarefa:", erro);

        res.status(500).json({
            mensagem: "Erro interno ao criar tarefa."
        });
    }
}


async function getTasks(req, res) {
    try {
        const {
            status,
            deadline,
            responsavel_id,
            prioridade
        } = req.query;

        let sql = `
            SELECT
                t.id,
                t.title,
                t.description,
                t.deadline,
                t.status,
                t.responsavel_id,
                t.prioridade,
                t.progresso,
                u.nome AS responsavel_nome,
                u.email AS responsavel_email
            FROM tasks t
            LEFT JOIN usuarios u
                ON t.responsavel_id = u.id_usuario
            WHERE 1=1
        `;

        const valores = [];

        
        if (req.usuario.nivel_acesso === "membro") {

            sql += " AND t.responsavel_id = ?";
            valores.push(Number(req.usuario.id_usuario));

        } else if (responsavel_id) {

            sql += " AND t.responsavel_id = ?";
            valores.push(Number(responsavel_id));
        }

        if (status) {
            sql += " AND t.status = ?";
            valores.push(status);
        }

        if (deadline) {
            sql += " AND DATE(t.deadline) = ?";
            valores.push(deadline);
        }

        if (prioridade) {
            sql += " AND t.prioridade = ?";
            valores.push(prioridade);
        }

        sql += `
            ORDER BY
                t.deadline IS NULL,
                t.deadline ASC,
                t.id DESC
        `;

        const [tarefas] = await db.query(sql, valores);

        res.json(tarefas);

    } catch (erro) {
        console.error("Erro ao listar tarefas:", erro);

        res.status(500).json({
            mensagem: "Erro ao listar tarefas."
        });
    }
}



async function updateTask(req, res) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                mensagem: "ID da tarefa inválido."
            });
        }

        // Busca a tarefa atual
        const [tarefas] = await db.query(
            "SELECT * FROM tasks WHERE id = ?",
            [id]
        );

        if (tarefas.length === 0) {
            return res.status(404).json({
                mensagem: "Tarefa não encontrada."
            });
        }

        const tarefaAtual = tarefas[0];


        if (req.usuario.nivel_acesso === "membro") {

            const idUsuarioLogado = Number(req.usuario.id_usuario);
            const idResponsavel = Number(tarefaAtual.responsavel_id);

            
            if (
                !tarefaAtual.responsavel_id ||
                idResponsavel !== idUsuarioLogado
            ) {
                return res.status(403).json({
                    mensagem: "Você só pode atualizar tarefas atribuídas a você."
                });
            }

            const { status, progresso } = req.body;

            
            const camposPermitidos = ["status", "progresso"];

            const camposRecebidos = Object.keys(req.body);

            const camposProibidos = camposRecebidos.filter(
                (campo) => !camposPermitidos.includes(campo)
            );

            if (camposProibidos.length > 0) {
                return res.status(403).json({
                    mensagem:
                        "Membros só podem alterar o status e o progresso da tarefa."
                });
            }

            
            const porcentagem =
                progresso === undefined || progresso === ""
                    ? tarefaAtual.progresso
                    : Number(progresso);

            if (
                Number.isNaN(porcentagem) ||
                porcentagem < 0 ||
                porcentagem > 100
            ) {
                return res.status(400).json({
                    mensagem: "O progresso deve estar entre 0 e 100."
                });
            }

           
            const sincronizado = sincronizarStatusProgresso(
                status || tarefaAtual.status,
                porcentagem
            );

            await db.query(
                `UPDATE tasks
                 SET status = ?,
                     progresso = ?
                 WHERE id = ?
                 AND responsavel_id = ?`,
                [
                    sincronizado.status,
                    sincronizado.progresso,
                    id,
                    idUsuarioLogado
                ]
            );

            return res.json({
                mensagem: "Tarefa atualizada com sucesso!"
            });
        }


        
        const {
            title,
            description,
            deadline,
            status,
            responsavel_id,
            prioridade,
            progresso
        } = req.body;

        if (!title || title.trim().length < 3) {
            return res.status(400).json({
                mensagem: "O título deve possuir no mínimo 3 caracteres."
            });
        }

        if (responsavel_id) {

            const [usuario] = await db.query(
                "SELECT id_usuario FROM usuarios WHERE id_usuario = ?",
                [responsavel_id]
            );

            if (usuario.length === 0) {
                return res.status(400).json({
                    mensagem: "Responsável não encontrado."
                });
            }
        }

        const porcentagem =
            progresso === undefined || progresso === ""
                ? tarefaAtual.progresso
                : Number(progresso);

        if (
            Number.isNaN(porcentagem) ||
            porcentagem < 0 ||
            porcentagem > 100
        ) {
            return res.status(400).json({
                mensagem: "O progresso deve estar entre 0 e 100."
            });
        }

        const sincronizado = sincronizarStatusProgresso(
            status || tarefaAtual.status,
            porcentagem
        );

        await db.query(
            `UPDATE tasks
             SET title = ?,
                 description = ?,
                 deadline = ?,
                 status = ?,
                 responsavel_id = ?,
                 prioridade = ?,
                 progresso = ?
             WHERE id = ?`,
            [
                title.trim(),
                description || null,
                deadline || null,
                sincronizado.status,
                responsavel_id || null,
                prioridade || tarefaAtual.prioridade,
                sincronizado.progresso,
                id
            ]
        );

        res.json({
            mensagem: "Tarefa atualizada com sucesso!"
        });

    } catch (erro) {
        console.error("Erro ao atualizar tarefa:", erro);

        res.status(500).json({
            mensagem: "Erro ao atualizar tarefa."
        });
    }
}


async function deleteTask(req, res) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                mensagem: "ID da tarefa inválido."
            });
        }

        const [resultado] = await db.query(
            "DELETE FROM tasks WHERE id = ?",
            [id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensagem: "Tarefa não encontrada."
            });
        }

        res.json({
            mensagem: "Tarefa removida com sucesso!"
        });

    } catch (erro) {
        console.error("Erro ao excluir tarefa:", erro);

        res.status(500).json({
            mensagem: "Erro ao excluir tarefa."
        });
    }
}


module.exports = {
    createTask,
    getTasks,
    updateTask,
    deleteTask,
    niveisGestao
};
