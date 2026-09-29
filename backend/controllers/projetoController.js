const db = require("../db/conexao");

const niveisGestao = ["administrador", "diretor", "mobilizador"];

function validarGestao(req, res) {
    if (!niveisGestao.includes(req.usuario?.nivel_acesso)) {
        res.status(403).json({ mensagem: "Você não possui permissão para gerenciar projetos." });
        return false;
    }
    return true;
}

async function listarCategorias(req, res) {
    try {
        const [categorias] = await db.query(`
            SELECT c.id_categoria, c.nome, c.descricao,
                   COUNT(p.id_projeto) AS quantidade_projetos
            FROM categorias_projeto c
            LEFT JOIN projetos p ON p.id_categoria = c.id_categoria
            GROUP BY c.id_categoria
            ORDER BY c.nome
        `);
        res.json(categorias);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ mensagem: "Erro ao listar categorias." });
    }
}

async function criarCategoria(req, res) {
    if (!validarGestao(req, res)) return;

    try {
        const { nome, descricao } = req.body;
        if (!nome || nome.trim().length < 2) {
            return res.status(400).json({ mensagem: "Informe um nome válido para a categoria." });
        }

        const [existente] = await db.query(
            "SELECT id_categoria FROM categorias_projeto WHERE nome = ?",
            [nome.trim()]
        );
        if (existente.length) {
            return res.status(409).json({ mensagem: "Esta categoria já existe." });
        }

        const [resultado] = await db.query(
            "INSERT INTO categorias_projeto (nome, descricao) VALUES (?, ?)",
            [nome.trim(), descricao?.trim() || null]
        );

        res.status(201).json({ mensagem: "Categoria criada com sucesso!", id: resultado.insertId });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ mensagem: "Erro ao criar categoria." });
    }
}

async function atualizarCategoria(req, res) {
    if (!validarGestao(req, res)) return;

    try {
        const id = Number(req.params.id);
        const { nome, descricao } = req.body;

        if (!Number.isInteger(id) || id <= 0 || !nome?.trim()) {
            return res.status(400).json({ mensagem: "Dados da categoria inválidos." });
        }

        const [duplicada] = await db.query(
            "SELECT id_categoria FROM categorias_projeto WHERE nome = ? AND id_categoria <> ?",
            [nome.trim(), id]
        );
        if (duplicada.length) {
            return res.status(409).json({ mensagem: "Esta categoria já existe." });
        }

        const [resultado] = await db.query(
            "UPDATE categorias_projeto SET nome = ?, descricao = ? WHERE id_categoria = ?",
            [nome.trim(), descricao?.trim() || null, id]
        );

        if (!resultado.affectedRows) {
            return res.status(404).json({ mensagem: "Categoria não encontrada." });
        }

        res.json({ mensagem: "Categoria atualizada com sucesso!" });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ mensagem: "Erro ao atualizar categoria." });
    }
}

async function excluirCategoria(req, res) {
    if (!validarGestao(req, res)) return;

    try {
        const id = Number(req.params.id);
        const [uso] = await db.query(
            "SELECT COUNT(*) AS total FROM projetos WHERE id_categoria = ?",
            [id]
        );

        if (uso[0].total > 0) {
            return res.status(409).json({
                mensagem: "Não é possível excluir uma categoria que possui projetos. Edite os projetos primeiro."
            });
        }

        const [resultado] = await db.query(
            "DELETE FROM categorias_projeto WHERE id_categoria = ?",
            [id]
        );

        if (!resultado.affectedRows) {
            return res.status(404).json({ mensagem: "Categoria não encontrada." });
        }

        res.json({ mensagem: "Categoria excluída com sucesso!" });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ mensagem: "Erro ao excluir categoria." });
    }
}

async function listarProjetos(req, res) {
    try {
        const [projetos] = await db.query(`
            SELECT
                p.id_projeto,
                p.nome,
                p.descricao,
                p.objetivo,
                p.documentos_necessarios,
                p.data_inicio,
                p.data_fim,
                p.status,
                p.id_categoria,
                c.nome AS categoria_nome,
                p.responsavel_id,
                u.nome AS responsavel_nome,
                COUNT(DISTINCT pt.id_tarefa) AS total_tarefas,
                COALESCE(ROUND(AVG(CASE WHEN t.status = 'Concluído' THEN 100 ELSE COALESCE(t.progresso, 0) END)), 0) AS progresso_medio,
                SUM(CASE WHEN t.status = 'Concluído' THEN 1 ELSE 0 END) AS tarefas_concluidas,
                SUM(CASE
                    WHEN t.deadline IS NOT NULL
                     AND t.deadline < CURDATE()
                     AND t.status <> 'Concluído'
                    THEN 1 ELSE 0 END) AS tarefas_atrasadas
            FROM projetos p
            INNER JOIN categorias_projeto c ON c.id_categoria = p.id_categoria
            LEFT JOIN usuarios u ON u.id_usuario = p.responsavel_id
            LEFT JOIN projeto_tarefas pt ON pt.id_projeto = p.id_projeto
            LEFT JOIN tasks t ON t.id = pt.id_tarefa
            GROUP BY p.id_projeto
            ORDER BY p.data_fim IS NULL, p.data_fim ASC, p.nome ASC
        `);

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const resultado = projetos.map((p) => {
            const fim = p.data_fim ? new Date(`${p.data_fim}T00:00:00`) : null;
            const atrasoPrazo = fim && fim < hoje && Number(p.progresso_medio) < 100;
            const prazoProximo = fim && fim >= hoje && ((fim - hoje) / 86400000) <= 7;
            const risco = !atrasoPrazo && prazoProximo && Number(p.progresso_medio) < 70;
            return {
                ...p,
                monitoramento: atrasoPrazo ? "Atrasado" : risco ? "Risco" : "Conforme"
            };
        });

        res.json(resultado);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ mensagem: "Erro ao listar projetos." });
    }
}

async function buscarProjeto(req, res) {
    try {
        const id = Number(req.params.id);
        const [projetos] = await db.query(`
            SELECT p.*, c.nome AS categoria_nome, u.nome AS responsavel_nome
            FROM projetos p
            INNER JOIN categorias_projeto c ON c.id_categoria = p.id_categoria
            LEFT JOIN usuarios u ON u.id_usuario = p.responsavel_id
            WHERE p.id_projeto = ?
        `, [id]);

        if (!projetos.length) return res.status(404).json({ mensagem: "Projeto não encontrado." });

        const [tarefas] = await db.query(`
            SELECT t.id, t.title, t.description, t.deadline, t.status, t.progresso,
                   t.prioridade, t.responsavel_id, u.nome AS responsavel_nome
            FROM projeto_tarefas pt
            INNER JOIN tasks t ON t.id = pt.id_tarefa
            LEFT JOIN usuarios u ON u.id_usuario = t.responsavel_id
            WHERE pt.id_projeto = ?
            ORDER BY t.deadline IS NULL, t.deadline ASC, t.title ASC
        `, [id]);

        res.json({ ...projetos[0], tarefas });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ mensagem: "Erro ao buscar projeto." });
    }
}

async function criarProjeto(req, res) {
    if (!validarGestao(req, res)) return;

    let conexao;
    try {
        const {
            nome, descricao, objetivo, documentos_necessarios,
            data_inicio, data_fim, status, id_categoria, responsavel_id, tarefas
        } = req.body;

        if (!nome?.trim() || !id_categoria) {
            return res.status(400).json({ mensagem: "Nome e categoria são obrigatórios." });
        }

        const [categoria] = await db.query("SELECT id_categoria FROM categorias_projeto WHERE id_categoria = ?", [id_categoria]);
        if (!categoria.length) return res.status(400).json({ mensagem: "Categoria não encontrada." });

        if (responsavel_id) {
            const [usuario] = await db.query("SELECT id_usuario FROM usuarios WHERE id_usuario = ?", [responsavel_id]);
            if (!usuario.length) return res.status(400).json({ mensagem: "Responsável não encontrado." });
        }

        conexao = await db.getConnection();
        await conexao.beginTransaction();
        const [resultado] = await conexao.query(`
            INSERT INTO projetos
            (nome, descricao, objetivo, documentos_necessarios, data_inicio, data_fim, status, id_categoria, responsavel_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            nome.trim(), descricao?.trim() || null, objetivo?.trim() || null,
            documentos_necessarios?.trim() || null, data_inicio || null, data_fim || null,
            status || "Planejamento", id_categoria, responsavel_id || null
        ]);

        await vincularTarefas(conexao, resultado.insertId, tarefas);
        await conexao.commit();

        res.status(201).json({ mensagem: "Projeto criado com sucesso!", id: resultado.insertId });
    } catch (erro) {
        await conexao.rollback();
        console.error(erro);
        res.status(500).json({ mensagem: "Erro ao criar projeto." });
    } finally {
        if (conexao) conexao.release();
    }
}

async function atualizarProjeto(req, res) {
    if (!validarGestao(req, res)) return;

    const conexao = await db.getConnection();
    try {
        const id = Number(req.params.id);
        const {
            nome, descricao, objetivo, documentos_necessarios,
            data_inicio, data_fim, status, id_categoria, responsavel_id, tarefas
        } = req.body;

        if (!Number.isInteger(id) || id <= 0 || !nome?.trim() || !id_categoria) {
            return res.status(400).json({ mensagem: "Dados do projeto inválidos." });
        }

        await conexao.beginTransaction();
        const [resultado] = await conexao.query(`
            UPDATE projetos SET
                nome = ?, descricao = ?, objetivo = ?, documentos_necessarios = ?,
                data_inicio = ?, data_fim = ?, status = ?, id_categoria = ?, responsavel_id = ?
            WHERE id_projeto = ?
        `, [
            nome.trim(), descricao?.trim() || null, objetivo?.trim() || null,
            documentos_necessarios?.trim() || null, data_inicio || null, data_fim || null,
            status || "Planejamento", id_categoria, responsavel_id || null, id
        ]);

        if (!resultado.affectedRows) {
            await conexao.rollback();
            return res.status(404).json({ mensagem: "Projeto não encontrado." });
        }

        await conexao.query("DELETE FROM projeto_tarefas WHERE id_projeto = ?", [id]);
        await vincularTarefas(conexao, id, tarefas);
        await conexao.commit();

        res.json({ mensagem: "Projeto atualizado com sucesso!" });
    } catch (erro) {
        await conexao.rollback();
        console.error(erro);
        res.status(500).json({ mensagem: "Erro ao atualizar projeto." });
    } finally {
        conexao.release();
    }
}

async function vincularTarefas(conexao, projetoId, tarefas = []) {
    if (!Array.isArray(tarefas) || tarefas.length === 0) return;

    const ids = [...new Set(tarefas.map(Number).filter((id) => Number.isInteger(id) && id > 0))];
    if (!ids.length) return;

    const placeholders = ids.map(() => "?").join(",");
    const [existentes] = await conexao.query(`SELECT id FROM tasks WHERE id IN (${placeholders})`, ids);

    for (const tarefa of existentes) {
        await conexao.query(
            "INSERT INTO projeto_tarefas (id_projeto, id_tarefa) VALUES (?, ?)",
            [projetoId, tarefa.id]
        );
    }
}

async function excluirProjeto(req, res) {
    if (!validarGestao(req, res)) return;

    try {
        const id = Number(req.params.id);
        const [resultado] = await db.query("DELETE FROM projetos WHERE id_projeto = ?", [id]);
        if (!resultado.affectedRows) return res.status(404).json({ mensagem: "Projeto não encontrado." });
        res.json({ mensagem: "Projeto excluído com sucesso!" });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ mensagem: "Erro ao excluir projeto." });
    }
}

async function monitorarProjeto(req, res) {
    try {
        const id = Number(req.params.id);
        const [dados] = await db.query(`
            SELECT
                p.id_projeto, p.nome, p.data_inicio, p.data_fim, p.status,
                COUNT(pt.id_tarefa) AS total_tarefas,
                COALESCE(ROUND(AVG(CASE WHEN t.status = 'Concluído' THEN 100 ELSE COALESCE(t.progresso, 0) END)), 0) AS progresso_medio,
                SUM(CASE WHEN t.status = 'Concluído' THEN 1 ELSE 0 END) AS concluidas,
                SUM(CASE WHEN t.deadline IS NOT NULL AND t.deadline < CURDATE() AND t.status <> 'Concluído' THEN 1 ELSE 0 END) AS atrasadas,
                SUM(CASE WHEN t.prioridade = 'Alta' OR t.status = 'Urgente' THEN 1 ELSE 0 END) AS itens_risco
            FROM projetos p
            LEFT JOIN projeto_tarefas pt ON pt.id_projeto = p.id_projeto
            LEFT JOIN tasks t ON t.id = pt.id_tarefa
            WHERE p.id_projeto = ?
            GROUP BY p.id_projeto
        `, [id]);

        if (!dados.length) return res.status(404).json({ mensagem: "Projeto não encontrado." });

        const projeto = dados[0];
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const fim = projeto.data_fim ? new Date(`${projeto.data_fim}T00:00:00`) : null;
        const atrasoPrazo = fim && fim < hoje && Number(projeto.progresso_medio) < 100;
        const prazoProximo = fim && fim >= hoje && ((fim - hoje) / 86400000) <= 7;
        const risco = !atrasoPrazo && prazoProximo && Number(projeto.progresso_medio) < 70;

        res.json({
            ...projeto,
            monitoramento: atrasoPrazo ? "Atrasado" : risco ? "Risco" : "Conforme"
        });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ mensagem: "Erro ao monitorar projeto." });
    }
}

module.exports = {
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
};
