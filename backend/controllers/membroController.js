const db = require("../db/conexao");

async function listarMembros(req, res) {
    try {
        const { nome } = req.query;

        let sql = `
            SELECT *
            FROM membros
        `;

        const valores = [];

        if (nome) {
            sql += ` WHERE nome LIKE ?`;
            valores.push(`%${nome}%`);
        }

        sql += ` ORDER BY nome`;

        const [membros] = await db.query(sql, valores);

        res.json(membros);
    } catch (erro) {
        console.error("Erro ao listar membros:", erro);

        res.status(500).json({
            mensagem: "Erro ao listar membros."
        });
    }
}


async function buscarMembroPorId(req, res) {
    try {
        const { id } = req.params;

        const [membros] = await db.query(
            "SELECT * FROM membros WHERE id = ?",
            [id]
        );

        if (membros.length === 0) {
            return res.status(404).json({
                mensagem: "Membro não encontrado."
            });
        }

        res.json(membros[0]);
    } catch (erro) {
        console.error("Erro ao buscar membro:", erro);

        res.status(500).json({
            mensagem: "Erro ao buscar membro."
        });
    }
}


async function cadastrarMembro(req, res) {
    try {
        const {
            nome,
            email,
            dataNascimento,
            diretoria,
            cargo,
            status,
            cpf,
            telefone,
            cep,
            endereco,
            numeroCasa
        } = req.body;

        if (
            !nome ||
            !email ||
            !dataNascimento ||
            !diretoria ||
            !cpf ||
            !telefone
        ) {
            return res.status(400).json({
                erro: "Nome, E-mail, Data de Nascimento, Diretoria, CPF e Telefone são obrigatórios."
            });
        }

        if (nome.trim().length < 3) {
            return res.status(400).json({
                erro: "O nome deve possuir pelo menos 3 caracteres."
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return res.status(400).json({
                erro: "O formato do e-mail é inválido."
            });
        }

        const nascimento = new Date(dataNascimento);
        const hoje = new Date();

        let idade =
            hoje.getFullYear() -
            nascimento.getFullYear();

        const mes =
            hoje.getMonth() -
            nascimento.getMonth();

        if (
            mes < 0 ||
            (mes === 0 &&
                hoje.getDate() < nascimento.getDate())
        ) {
            idade--;
        }

        if (idade < 16) {
            return res.status(400).json({
                erro: "O membro deve possuir pelo menos 16 anos."
            });
        }

        const [resultado] = await db.query(
            `
            INSERT INTO membros
            (
                nome,
                email,
                dataNascimento,
                diretoria,
                cargo,
                status,
                cpf,
                telefone,
                cep,
                endereco,
                numeroCasa
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                nome,
                email,
                dataNascimento,
                diretoria,
                cargo || null,
                status || "Ativo",
                cpf,
                telefone,
                cep || null,
                endereco || null,
                numeroCasa || null
            ]
        );

        res.status(201).json({
            mensagem: "Membro cadastrado com sucesso.",
            id: resultado.insertId
        });

    } catch (erro) {
        console.error("Erro ao cadastrar membro:", erro);

        res.status(500).json({
            mensagem: "Erro ao cadastrar membro."
        });
    }
}


async function atualizarMembro(req, res) {
    try {
        const { id } = req.params;

        const {
            nome,
            email,
            dataNascimento,
            diretoria,
            cargo,
            status,
            cpf,
            telefone,
            cep,
            endereco,
            numeroCasa
        } = req.body;

        if (
            !nome ||
            !email ||
            !dataNascimento ||
            !diretoria ||
            !cpf ||
            !telefone
        ) {
            return res.status(400).json({
                erro: "Nome, E-mail, Data de Nascimento, Diretoria, CPF e Telefone são obrigatórios."
            });
        }

        if (nome.trim().length < 3) {
            return res.status(400).json({
                erro: "O nome deve possuir pelo menos 3 caracteres."
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return res.status(400).json({
                erro: "O formato do e-mail é inválido."
            });
        }

        const nascimento = new Date(dataNascimento);
        const hoje = new Date();

        let idade =
            hoje.getFullYear() -
            nascimento.getFullYear();

        const mes =
            hoje.getMonth() -
            nascimento.getMonth();

        if (
            mes < 0 ||
            (mes === 0 &&
                hoje.getDate() < nascimento.getDate())
        ) {
            idade--;
        }

        if (idade < 16) {
            return res.status(400).json({
                erro: "O membro deve possuir pelo menos 16 anos."
            });
        }

        const [resultado] = await db.query(
            `
            UPDATE membros
            SET
                nome = ?,
                email = ?,
                dataNascimento = ?,
                diretoria = ?,
                cargo = ?,
                status = ?,
                cpf = ?,
                telefone = ?,
                cep = ?,
                endereco = ?,
                numeroCasa = ?
            WHERE id = ?
            `,
            [
                nome,
                email,
                dataNascimento,
                diretoria,
                cargo || null,
                status || "Ativo",
                cpf,
                telefone,
                cep || null,
                endereco || null,
                numeroCasa || null,
                id
            ]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensagem: "Membro não encontrado."
            });
        }

        res.json({
            mensagem: "Membro atualizado com sucesso."
        });

    } catch (erro) {
        console.error("Erro ao atualizar membro:", erro);

        res.status(500).json({
            mensagem: "Erro ao atualizar membro."
        });
    }
}


async function excluirMembro(req, res) {
    try {
        const { id } = req.params;

        const [resultado] = await db.query(
            "DELETE FROM membros WHERE id = ?",
            [id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensagem: "Membro não encontrado."
            });
        }

        res.json({
            mensagem: "Membro excluído com sucesso."
        });

    } catch (erro) {
        console.error("Erro ao excluir membro:", erro);

        res.status(500).json({
            mensagem: "Erro ao excluir membro."
        });
    }
}


module.exports = {
    listarMembros,
    buscarMembroPorId,
    cadastrarMembro,
    atualizarMembro,
    excluirMembro
};
