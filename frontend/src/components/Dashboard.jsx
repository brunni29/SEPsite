import { useState, useEffect } from "react"; 
import { Link } from "react-router-dom";

const API = "http://localhost:3000";

const nomes = {
    administrador: "Administrador",
    diretor: "Diretor",
    mobilizador: "Mobilizador",
    membro: "Membro"
};

function Dashboard({ usuario, onLogout }) {
    const [usuarios, setUsuarios] = useState([]);
    const [mensagem, setMensagem] = useState("");

    const token = localStorage.getItem("token");

    const administrador = usuario.nivel_acesso === "administrador";
    const diretor = ["administrador", "diretor"].includes(
        usuario.nivel_acesso
    );
    const mobilizador = [
        "administrador",
        "diretor",
        "mobilizador"
    ].includes(usuario.nivel_acesso);

    useEffect(() => {
        if (administrador) {
            carregarUsuarios();
        }
    }, []);

    async function carregarUsuarios() {
        try {
            const resposta = await fetch(`${API}/usuarios`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const dados = await resposta.json();

            if (resposta.ok) {
                setUsuarios(dados);
            } else {
                setMensagem(dados.mensagem);
            }
        } catch {
            setMensagem("Erro ao conectar com o backend.");
        }
    }

    async function alterarNivel(id, nivel_acesso) {
        try {
            const resposta = await fetch(
                `${API}/usuarios/${id}/nivel`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ nivel_acesso })
                }
            );

            const dados = await resposta.json();

            if (!resposta.ok) {
                setMensagem(dados.mensagem);
                return;
            }

            setMensagem(dados.mensagem);
            carregarUsuarios();
        } catch {
            setMensagem("Erro ao alterar nível.");
        }
    }

    return (
        <div className="container py-4 page-container">
            <div className="page-heading">
                <div>
                    <span className="eyebrow">VISÃO GERAL</span>
                    <h1>Dashboard</h1>
                    <p>Olá, <strong>{usuario.nome}</strong>. Bem-vindo ao sistema.</p>
                </div>
                <div className="access-pill">
                    <span>Nível de acesso</span>
                    <strong>{nomes[usuario.nivel_acesso]}</strong>
                </div>
            </div>

            <div className="alert alert-primary access-alert">
                Nível de acesso:{" "}
                <strong>{nomes[usuario.nivel_acesso]}</strong>
            </div>

            {mensagem && (
                <div className="alert alert-info">
                    {mensagem}
                </div>
            )}

            <div className="row g-3">
                <div className="col-md-6">
                    <div className="card p-4 h-100">
                        <h3>Área do membro</h3>
                        <p>
                            Área básica disponível para usuários autenticados.
                        </p>
                        <Link to="/agendamentos" className="btn-funcao">
                            <span>📅</span>
                            <span>Agendamentos</span>
                            <span className="seta">→</span>
                        </Link>
                        <Link to="/tarefas" className="btn-funcao">
                            <span>✅</span>
                            <span>Tarefas</span>
                            <span className="seta">→</span>
                        </Link>
                    </div>
                </div>

                {mobilizador && (
                    <div className="col-md-6">
                        <div className="card p-4 h-100">
                            <h3>Área de mobilização</h3>
                            <p>
                                Disponível para mobilizador, diretor e administrador.
                            </p>
                            <Link to="/membros" className="btn-funcao">
                                <span>👥</span>
                                <span>Gerenciar Membros</span>
                                <span className="seta">→</span>
                            </Link>
                            <Link to="/cadastro" className="btn-funcao">
                                <span>👤</span>
                                <span>Gerenciar usuários</span>
                                <span className="seta">→</span>
                            </Link>
                            <Link to="/projetos" className="btn-funcao">
                                <span>📁</span>
                                <span>Gerenciar projetos</span>
                                <span className="seta">→</span>
                            </Link>
                        </div>
                    </div>
                )}

                {diretor && (
                    <div className="col-md-6">
                        <div className="card p-4 h-100">
                            <h3>Área da diretoria</h3>
                            <p>
                                Disponível para diretor e administrador.
                            </p>
                        </div>
                    </div>
                )}

                {administrador && (
                    <div className="col-12">
                        <div className="card p-4">
                            <h3>Gerenciamento de usuários</h3>
                            <p>
                                Somente o administrador pode alterar os níveis.
                            </p>

                            <div className="table-responsive">
                                <table className="table table-bordered align-middle">
                                    <thead>
                                        <tr>
                                            <th>Nome</th>
                                            <th>E-mail</th>
                                            <th>Nível</th>
                                            <th>Alterar</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {usuarios.map((u) => (
                                            <tr key={u.id_usuario}>
                                                <td>{u.nome}</td>
                                                <td>{u.email}</td>
                                                <td>
                                                    {nomes[u.nivel_acesso]}
                                                </td>
                                                <td>
                                                    {u.id_usuario === usuario.id_usuario ? (
                                                        <span className="text-muted">
                                                            Usuário atual
                                                        </span>
                                                    ) : (
                                                        <select
                                                            className="form-select"
                                                            value={u.nivel_acesso}
                                                            onChange={(e) =>
                                                                alterarNivel(
                                                                    u.id_usuario,
                                                                    e.target.value
                                                                )
                                                            }
                                                        >
                                                            <option value="membro">
                                                                Membro
                                                            </option>
                                                            <option value="mobilizador">
                                                                Mobilizador
                                                            </option>
                                                            <option value="diretor">
                                                                Diretor
                                                            </option>
                                                            <option value="administrador">
                                                                Administrador
                                                            </option>
                                                        </select>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Dashboard;
