import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import TarefaForm from "../components/TarefaForm";
import TarefaList from "../components/TarefaList";

const API = "http://localhost:3000";

function Tarefas() {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
    const token = localStorage.getItem("token");

    const podeGerenciar = ["administrador", "diretor", "mobilizador"].includes(
        usuario?.nivel_acesso
    );

    const [tarefas, setTarefas] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [editando, setEditando] = useState(null);
    const [filtros, setFiltros] = useState({
        status: "",
        prioridade: "",
        responsavel_id: "",
        deadline: ""
    });

    async function carregarUsuarios() {
        if (!podeGerenciar) return;

        try {
            const resposta = await fetch(`${API}/usuarios`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (resposta.ok) {
                const dados = await resposta.json();
                setUsuarios(dados);
            }
        } catch (erro) {
            console.error("Erro ao carregar usuários:", erro);
        }
    }

    async function carregarTarefas() {
        try {
            const params = new URLSearchParams();

            Object.entries(filtros).forEach(([chave, valor]) => {
                if (valor) params.append(chave, valor);
            });

            const url = params.toString()
                ? `${API}/tasks?${params.toString()}`
                : `${API}/tasks`;

            const resposta = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(dados.mensagem || "Erro ao carregar tarefas.");
            }

            setTarefas(dados);
        } catch (erro) {
            console.error(erro);
            alert(erro.message || "Erro ao carregar tarefas.");
        }
    }

    useEffect(() => {
        carregarUsuarios();
    }, []);

    useEffect(() => {
        carregarTarefas();
    }, [filtros]);

    async function salvarTarefa(tarefa) {
        try {
            const url = editando
                ? `${API}/tasks/${editando.id}`
                : `${API}/tasks`;

            const resposta = await fetch(url, {
                method: editando ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(tarefa)
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(dados.mensagem || "Erro ao salvar tarefa.");
            }

            alert(dados.mensagem);
            setEditando(null);
            await carregarTarefas();
        } catch (erro) {
            console.error(erro);
            alert(erro.message || "Erro ao salvar tarefa.");
            throw erro;
        }
    }

    async function excluirTarefa(id) {
        if (!window.confirm("Deseja realmente excluir esta tarefa?")) return;

        try {
            const resposta = await fetch(`${API}/tasks/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(dados.mensagem || "Erro ao excluir tarefa.");
            }

            alert(dados.mensagem);
            await carregarTarefas();
        } catch (erro) {
            console.error(erro);
            alert(erro.message || "Erro ao excluir tarefa.");
        }
    }

    function alterarFiltro(campo, valor) {
        setFiltros((anterior) => ({
            ...anterior,
            [campo]: valor
        }));
    }

    function limparFiltros() {
        setFiltros({
            status: "",
            prioridade: "",
            responsavel_id: "",
            deadline: ""
        });
    }

    return (
        <div className="container py-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="mb-1">Gerenciar Tarefas</h1>
                    <p className="text-muted mb-0">
                        Criação, atribuição e acompanhamento de tarefas
                    </p>
                </div>

                <Link to="/dashboard" className="btn btn-outline-primary">
                    ← Voltar para Dashboard
                </Link>
            </div>

            {editando ? (
                <TarefaForm
                    aoSalvar={salvarTarefa}
                    editando={editando}
                    cancelar={() => setEditando(null)}
                    usuarios={usuarios}
                    podeGerenciar={podeGerenciar}
                />
                ) : !podeGerenciar ? (
                <div className="alert alert-info">
                    Você está visualizando as tarefas atribuídas a você.
                    Clique em <strong>Editar</strong> para atualizar o status e o progresso.
                </div>
                ) : (
                <TarefaForm
                    aoSalvar={salvarTarefa}
                    editando={null}
                    cancelar={() => setEditando(null)}
                    usuarios={usuarios}
                    podeGerenciar={podeGerenciar}
                />
                )}

            <div className="card shadow-sm border-0 mb-4">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0">Filtros</h5>
                        <button className="btn btn-outline-secondary btn-sm" onClick={limparFiltros}>
                            Limpar filtros
                        </button>
                    </div>

                    <div className="row g-3">
                        <div className="col-md-3">
                            <label className="form-label">Status</label>
                            <select
                                className="form-select"
                                value={filtros.status}
                                onChange={(e) => alterarFiltro("status", e.target.value)}
                            >
                                <option value="">Todos</option>
                                <option>Pendente</option>
                                <option>Em andamento</option>
                                <option>Urgente</option>
                                <option>Concluído</option>
                            </select>
                        </div>

                        <div className="col-md-3">
                            <label className="form-label">Prioridade</label>
                            <select
                                className="form-select"
                                value={filtros.prioridade}
                                onChange={(e) => alterarFiltro("prioridade", e.target.value)}
                            >
                                <option value="">Todas</option>
                                <option>Baixa</option>
                                <option>Média</option>
                                <option>Alta</option>
                                <option>Urgente</option>
                            </select>
                        </div>

                        {podeGerenciar && (
                            <div className="col-md-3">
                                <label className="form-label">Responsável</label>
                                <select
                                    className="form-select"
                                    value={filtros.responsavel_id}
                                    onChange={(e) => alterarFiltro("responsavel_id", e.target.value)}
                                >
                                    <option value="">Todos</option>
                                    {usuarios.map((usuario) => (
                                        <option key={usuario.id_usuario} value={usuario.id_usuario}>
                                            {usuario.nome}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className={podeGerenciar ? "col-md-3" : "col-md-6"}>
                            <label className="form-label">Prazo</label>
                            <input
                                type="date"
                                className="form-control"
                                value={filtros.deadline}
                                onChange={(e) => alterarFiltro("deadline", e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <TarefaList
                tarefas={tarefas}
                editar={setEditando}
                excluir={excluirTarefa}
                podeGerenciar={podeGerenciar}
            />
        </div>
    );
}

export default Tarefas;
