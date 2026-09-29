const bcrypt = require("bcryptjs");
const db = require("../db/conexao");

const niveisValidos = [
    "administrador",
    "diretor",
    "mobilizador",
    "membro"
];

async function listarUsuarios(req, res) {
    try {
        const [usuarios] = await db.query(
            "SELECT id_usuario, nome, email, nivel_acesso, criado_em FROM usuarios ORDER BY nome"
        );

        res.json(usuarios);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({
            mensagem: "Erro ao listar usuários."
        });
    }
}

async function alterarNivel(req, res) {
    try {
        const { id } = req.params;
        const { nivel_acesso } = req.body;

        if (!niveisValidos.includes(nivel_acesso)) {
            return res.status(400).json({
                mensagem: "Nível de acesso inválido."
            });
        }

        if (Number(id) === Number(req.usuario.id_usuario)) {
            return res.status(400).json({
                mensagem: "Por segurança, o administrador não pode alterar o próprio nível."
            });
        }

        const [resultado] = await db.query(
            "UPDATE usuarios SET nivel_acesso = ? WHERE id_usuario = ?",
            [nivel_acesso, id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensagem: "Usuário não encontrado."
            });
        }

        res.json({
            mensagem: "Nível de acesso alterado com sucesso."
        });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({
            mensagem: "Erro ao alterar nível."
        });
    }
}

async function atualizarUsuario(req, res) {
    try {
        const id = Number(req.params.id);
        const { nome, email, senha, nivel_acesso } = req.body;

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                mensagem: "ID do usuário inválido."
            });
        }

        if (!nome || !nome.trim()) {
            return res.status(400).json({
                mensagem: "O nome é obrigatório."
            });
        }

        if (!email || !email.trim()) {
            return res.status(400).json({
                mensagem: "O e-mail é obrigatório."
            });
        }

        const [existente] = await db.query(
            "SELECT id_usuario, nivel_acesso FROM usuarios WHERE id_usuario = ?",
            [id]
        );

        if (existente.length === 0) {
            return res.status(404).json({
                mensagem: "Usuário não encontrado."
            });
        }

        const [emailExistente] = await db.query(
            "SELECT id_usuario FROM usuarios WHERE email = ? AND id_usuario <> ?",
            [email.trim(), id]
        );

        if (emailExistente.length > 0) {
            return res.status(409).json({
                mensagem: "Este e-mail já está cadastrado."
            });
        }

        const podeAlterarNivel = req.usuario.nivel_acesso === "administrador";

        if (nivel_acesso !== undefined && !niveisValidos.includes(nivel_acesso)) {
            return res.status(400).json({
                mensagem: "Nível de acesso inválido."
            });
        }

        if (nivel_acesso !== undefined && !podeAlterarNivel) {
            return res.status(403).json({
                mensagem: "Somente o administrador pode alterar o nível de acesso."
            });
        }

        if (
            Number(id) === Number(req.usuario.id_usuario) &&
            nivel_acesso !== undefined &&
            nivel_acesso !== existente[0].nivel_acesso
        ) {
            return res.status(400).json({
                mensagem: "Por segurança, você não pode alterar o próprio nível de acesso."
            });
        }

        let sql = "UPDATE usuarios SET nome = ?, email = ?";
        const valores = [nome.trim(), email.trim()];

        if (nivel_acesso !== undefined && podeAlterarNivel) {
            sql += ", nivel_acesso = ?";
            valores.push(nivel_acesso);
        }

        if (senha && senha.trim()) {
            if (senha.length < 6) {
                return res.status(400).json({
                    mensagem: "A senha deve ter pelo menos 6 caracteres."
                });
            }

            const senhaHash = await bcrypt.hash(senha, 10);
            sql += ", senha = ?";
            valores.push(senhaHash);
        }

        sql += " WHERE id_usuario = ?";
        valores.push(id);

        await db.query(sql, valores);

        res.json({
            mensagem: "Usuário atualizado com sucesso."
        });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({
            mensagem: "Erro ao atualizar usuário."
        });
    }
}

async function excluirUsuario(req, res) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                mensagem: "ID do usuário inválido."
            });
        }

        if (id === Number(req.usuario.id_usuario)) {
            return res.status(400).json({
                mensagem: "Por segurança, você não pode excluir o próprio usuário."
            });
        }

        const [resultado] = await db.query(
            "DELETE FROM usuarios WHERE id_usuario = ?",
            [id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensagem: "Usuário não encontrado."
            });
        }

        res.json({
            mensagem: "Usuário excluído com sucesso."
        });
    } catch (erro) {
        console.error(erro);

        if (erro.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(409).json({
                mensagem: "Não é possível excluir este usuário porque existem registros vinculados a ele."
            });
        }

        res.status(500).json({
            mensagem: "Erro ao excluir usuário."
        });
    }
}

module.exports = {
    listarUsuarios,
    alterarNivel,
    atualizarUsuario,
    excluirUsuario
};
