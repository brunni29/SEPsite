const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const db = require("../db/conexao");

async function cadastrar(req, res) {
    try {
        const { nome, email, senha, nivel_acesso } = req.body;

        if (!nome || !email || !senha) {
            return res.status(400).json({ mensagem: "Nome, e-mail e senha são obrigatórios." });
        }

        if (senha.length < 6) {
            return res.status(400).json({ mensagem: "A senha deve ter pelo menos 6 caracteres." });
        }

        const [existente] = await db.query("SELECT id_usuario FROM usuarios WHERE email = ?", [email]);
        if (existente.length > 0) {
            return res.status(409).json({ mensagem: "Este e-mail já está cadastrado." });
        }

        const niveisValidos = [
            "administrador",
            "diretor",
            "mobilizador",
            "membro"
        ];

        let nivelFinal = "membro";

        if (nivel_acesso !== undefined) {
            if (req.usuario.nivel_acesso !== "administrador") {
                return res.status(403).json({
                    mensagem: "Somente o administrador pode definir o nível de acesso."
                });
            }

            if (!niveisValidos.includes(nivel_acesso)) {
                return res.status(400).json({
                    mensagem: "Nível de acesso inválido."
                });
            }

            nivelFinal = nivel_acesso;
        }

        const senhaHash = await bcrypt.hash(senha, 10);
        await db.query(
            "INSERT INTO usuarios (nome, email, senha, nivel_acesso) VALUES (?, ?, ?, ?)",
            [nome.trim(), email.trim(), senhaHash, nivelFinal]
        );

        res.status(201).json({
            mensagem: `Usuário cadastrado com sucesso. Nível: ${nivelFinal}.`
        });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ mensagem: "Erro interno ao cadastrar usuário." });
    }
}

async function login(req, res) {
    try {
        const { email, senha } = req.body;
        if (!email || !senha) return res.status(400).json({ mensagem: "E-mail e senha são obrigatórios." });

        const [usuarios] = await db.query(
            "SELECT id_usuario, nome, email, senha, nivel_acesso FROM usuarios WHERE email = ?",
            [email]
        );
        if (usuarios.length === 0) return res.status(401).json({ mensagem: "E-mail ou senha inválidos." });

        const usuario = usuarios[0];
        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        if (!senhaValida) return res.status(401).json({ mensagem: "E-mail ou senha inválidos." });

        const token = jwt.sign(
            { id_usuario: usuario.id_usuario, nome: usuario.nome, email: usuario.email, nivel_acesso: usuario.nivel_acesso },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        );

        res.json({
            mensagem: "Login realizado com sucesso.",
            token,
            usuario: {
                id_usuario: usuario.id_usuario,
                nome: usuario.nome,
                email: usuario.email,
                nivel_acesso: usuario.nivel_acesso
            }
        });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ mensagem: "Erro interno ao fazer login." });
    }
}

function criarTransportador() {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null;

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
}

async function solicitarRecuperacao(req, res) {
    const respostaPadrao = "Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.";

    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ mensagem: "Informe o e-mail." });

        const [usuarios] = await db.query(
            "SELECT id_usuario, nome, email FROM usuarios WHERE email = ?",
            [email]
        );

        if (usuarios.length === 0) return res.json({ mensagem: respostaPadrao });

        const transportador = criarTransportador();
        if (!transportador) {
            console.error("SMTP não configurado. Configure SMTP_HOST, SMTP_USER e SMTP_PASS no .env.");
            return res.status(500).json({ mensagem: "A recuperação de senha ainda não está configurada no servidor." });
        }

        const usuario = usuarios[0];
        const token = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

        await db.query("DELETE FROM recuperacao_senha WHERE id_usuario = ?", [usuario.id_usuario]);
        await db.query(
            "INSERT INTO recuperacao_senha (id_usuario, token_hash, expira_em) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE))",
            [usuario.id_usuario, tokenHash]
        );

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const link = `${frontendUrl}/redefinir-senha?token=${token}`;

        await transportador.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: usuario.email,
            subject: "SEP - Recuperação de senha",
            text: `Olá, ${usuario.nome}!\n\nRecebemos uma solicitação para redefinir sua senha. Acesse o link abaixo em até 15 minutos:\n\n${link}\n\nSe você não solicitou a recuperação, ignore este e-mail.`,
            html: `<p>Olá, <strong>${usuario.nome}</strong>!</p><p>Recebemos uma solicitação para redefinir sua senha.</p><p><a href="${link}">Clique aqui para criar uma nova senha</a></p><p>Este link é válido por 15 minutos.</p><p>Se você não solicitou a recuperação, ignore este e-mail.</p>`
        });

        return res.json({ mensagem: respostaPadrao });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ mensagem: "Não foi possível iniciar a recuperação de senha." });
    }
}

async function redefinirSenha(req, res) {
    try {
        const { token, senha } = req.body;
        if (!token || !senha) return res.status(400).json({ mensagem: "Token e nova senha são obrigatórios." });
        if (senha.length < 6) return res.status(400).json({ mensagem: "A senha deve ter pelo menos 6 caracteres." });

        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
        const [registros] = await db.query(
            `SELECT id_usuario FROM recuperacao_senha WHERE token_hash = ? AND expira_em > NOW()`,
            [tokenHash]
        );

        if (registros.length === 0) return res.status(400).json({ mensagem: "Link inválido ou expirado." });

        const senhaHash = await bcrypt.hash(senha, 10);
        await db.query("UPDATE usuarios SET senha = ? WHERE id_usuario = ?", [senhaHash, registros[0].id_usuario]);
        await db.query("DELETE FROM recuperacao_senha WHERE token_hash = ?", [tokenHash]);

        res.json({ mensagem: "Senha redefinida com sucesso. Você já pode fazer login." });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ mensagem: "Erro interno ao redefinir a senha." });
    }
}

module.exports = { cadastrar, login, solicitarRecuperacao, redefinirSenha };
