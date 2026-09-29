import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API = "http://localhost:3000";

const nomes = {
    administrador: "Administrador",
    diretor: "Diretor",
    mobilizador: "Mobilizador",
    membro: "Membro"
};

const niveis = [
    { valor: "membro", nome: "Membro" },
    { valor: "mobilizador", nome: "Mobilizador" },
    { valor: "diretor", nome: "Diretor" },
    { valor: "administrador", nome: "Administrador" }
];

function Cadastro() {
    const [usuarios, setUsuarios] = useState([]);
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");
    const [nivelAcesso, setNivelAcesso] = useState("membro");
    const [editandoId, setEditandoId] = useState(null);
    const [mensagem, setMensagem] = useState("");
    const [erro, setErro] = useState("");
    const [carregando, setCarregando] = useState(true);

    const usuarioAtual = JSON.parse(localStorage.getItem("usuario") || "null");
    const token = localStorage.getItem("token");
    const administrador = usuarioAtual?.nivel_acesso === "administrador";

    useEffect(() => {
        carregarUsuarios();
    }, []);

    async function carregarUsuarios() {
        try {
            setCarregando(true);

            const resposta = await fetch(`${API}/usuarios`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(dados.mensagem || "Erro ao listar usuários.");
            }

            setUsuarios(dados);
        } catch (err) {
            setErro(err.message || "Erro ao conectar com o backend.");
        } finally {
            setCarregando(false);
        }
    }

    function limparFormulario() {
        setNome("");
        setEmail("");
        setSenha("");
        setConfirmarSenha("");
        setNivelAcesso("membro");
        setEditandoId(null);
    }

    function editarUsuario(usuario) {
        setMensagem("");
        setErro("");
        setEditandoId(usuario.id_usuario);
        setNome(usuario.nome);
        setEmail(usuario.email);
        setSenha("");
        setConfirmarSenha("");
        setNivelAcesso(usuario.nivel_acesso);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    async function enviar(e) {
        e.preventDefault();
        setMensagem("");
        setErro("");

        if (senha && senha !== confirmarSenha) {
            setErro("As senhas não são iguais.");
            return;
        }

        if (!editandoId && !senha) {
            setErro("Informe uma senha para o novo usuário.");
            return;
        }

        try {
            const corpo = {
                nome,
                email
            };

            if (senha) {
                corpo.senha = senha;
            }

            if (administrador) {
                corpo.nivel_acesso = nivelAcesso;
            }

            const url = editandoId
                ? `${API}/usuarios/${editandoId}`
                : `${API}/auth/cadastro`;

            const resposta = await fetch(url, {
                method: editandoId ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(corpo)
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(dados.mensagem || "Erro ao salvar usuário.");
            }

            setMensagem(
                editandoId
                    ? "Usuário atualizado com sucesso."
                    : dados.mensagem || "Usuário cadastrado com sucesso."
            );

            limparFormulario();
            carregarUsuarios();
        } catch (err) {
            setErro(err.message || "Erro ao salvar usuário.");
        }
    }

    async function excluirUsuario(id, nomeUsuario) {
        if (id === usuarioAtual?.id_usuario) {
            setErro("Por segurança, você não pode excluir o próprio usuário.");
            return;
        }

        const confirmar = window.confirm(
            `Deseja realmente excluir o usuário "${nomeUsuario}"?`
        );

        if (!confirmar) return;

        setMensagem("");
        setErro("");

        try {
            const resposta = await fetch(`${API}/usuarios/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(dados.mensagem || "Erro ao excluir usuário.");
            }

            setMensagem(dados.mensagem);
            carregarUsuarios();
        } catch (err) {
            setErro(err.message || "Erro ao excluir usuário.");
        }
    }

    return (
        <div className="container py-4 page-container">
            <div className="page-heading">
                <div>
                    <span className="eyebrow">ÁREA DE MOBILIZAÇÃO</span>
                    <h1>Gerenciar usuários</h1>
                    <p>
                        Cadastre, consulte, edite e exclua os usuários do sistema.
                    </p>
                </div>

                <Link to="/dashboard" className="btn btn-outline-primary">
                    ← Voltar para Dashboard
                </Link>
            </div>

            {erro && (
                <div className="alert alert-danger">
                    {erro}
                </div>
            )}

            {mensagem && (
                <div className="alert alert-success">
                    {mensagem}
                </div>
            )}

            <div className="card shadow-sm border-0 mb-4">
                <div
                    className="card-header text-white"
                    style={{ backgroundColor: "#045148" }}
                >
                    <h5 className="mb-0">
                        {editandoId ? "Editar usuário" : "Novo cadastro"}
                    </h5>
                </div>

                <div className="card-body">
                    <form onSubmit={enviar}>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label fw-bold">Nome</label>
                                <input
                                    className="form-control"
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="col-md-6">
                                <label className="form-label fw-bold">E-mail</label>
                                <input
                                    className="form-control"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="col-md-6">
                                <label className="form-label fw-bold">
                                    {editandoId
                                        ? "Nova senha (opcional)"
                                        : "Senha"}
                                </label>
                                <input
                                    className="form-control"
                                    type="password"
                                    minLength="6"
                                    value={senha}
                                    onChange={(e) => setSenha(e.target.value)}
                                    required={!editandoId}
                                    placeholder={editandoId ? "Deixe em branco para manter" : ""}
                                />
                            </div>

                            <div className="col-md-6">
                                <label className="form-label fw-bold">
                                    Confirmar senha
                                </label>
                                <input
                                    className="form-control"
                                    type="password"
                                    minLength="6"
                                    value={confirmarSenha}
                                    onChange={(e) => setConfirmarSenha(e.target.value)}
                                    required={Boolean(senha)}
                                />
                            </div>

                            {administrador && (
                                <div className="col-md-6">
                                    <label className="form-label fw-bold">
                                        Nível de acesso
                                    </label>
                                    <select
                                        className="form-select"
                                        value={nivelAcesso}
                                        onChange={(e) => setNivelAcesso(e.target.value)}
                                    >
                                        {niveis.map((nivel) => (
                                            <option key={nivel.valor} value={nivel.valor}>
                                                {nivel.nome}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {!administrador && (
                                <div className="col-12">
                                    <div className="alert alert-secondary mb-0">
                                        <strong>Nível:</strong>{" "}
                                        {editandoId
                                            ? nomes[usuarios.find((u) => u.id_usuario === editandoId)?.nivel_acesso] || "Membro"
                                            : "Membro"}
                                        <br />
                                        <small>
                                            Somente o administrador pode alterar o nível de acesso.
                                        </small>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="d-flex gap-2 mt-4">
                            <button
                                type="submit"
                                className="btn text-white"
                                style={{ backgroundColor: "#DA5321" }}
                            >
                                {editandoId ? "Salvar alterações" : "Cadastrar usuário"}
                            </button>

                            {editandoId && (
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={limparFormulario}
                                >
                                    Cancelar edição
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            <div className="card shadow-sm border-0">
                <div
                    className="card-header text-white d-flex justify-content-between align-items-center"
                    style={{ backgroundColor: "#045148" }}
                >
                    <h5 className="mb-0">Usuários cadastrados</h5>
                    <span className="badge bg-light text-dark">
                        {usuarios.length} usuário(s)
                    </span>
                </div>

                <div className="card-body">
                    {carregando ? (
                        <p className="text-muted mb-0">Carregando usuários...</p>
                    ) : usuarios.length === 0 ? (
                        <p className="text-muted mb-0">
                            Nenhum usuário cadastrado.
                        </p>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th>Nome</th>
                                        <th>E-mail</th>
                                        <th>Nível</th>
                                        <th>Cadastro</th>
                                        <th className="text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usuarios.map((u) => (
                                        <tr key={u.id_usuario}>
                                            <td className="fw-semibold">{u.nome}</td>
                                            <td>{u.email}</td>
                                            <td>
                                                <span className="badge bg-primary">
                                                    {nomes[u.nivel_acesso]}
                                                </span>
                                            </td>
                                            <td>
                                                {u.criado_em
                                                    ? new Date(u.criado_em).toLocaleDateString("pt-BR")
                                                    : "-"}
                                            </td>
                                            <td>
                                                <div className="d-flex justify-content-center gap-2">
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-primary"
                                                        onClick={() => editarUsuario(u)}
                                                    >
                                                        Editar
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() =>
                                                            excluirUsuario(u.id_usuario, u.nome)
                                                        }
                                                        disabled={u.id_usuario === usuarioAtual?.id_usuario}
                                                        title={
                                                            u.id_usuario === usuarioAtual?.id_usuario
                                                                ? "Você não pode excluir seu próprio usuário"
                                                                : "Excluir usuário"
                                                        }
                                                    >
                                                        Excluir
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Cadastro;
