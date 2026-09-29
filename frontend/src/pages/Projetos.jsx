import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const API = "http://localhost:3000";

const projetoInicial = {
    nome: "",
    descricao: "",
    objetivo: "",
    documentos_necessarios: "",
    data_inicio: "",
    data_fim: "",
    status: "Planejamento",
    id_categoria: "",
    responsavel_id: "",
    tarefas: []
};

function formatarData(data) {
    if (!data) return "—";
    const valor = String(data).slice(0, 10);
    const [ano, mes, dia] = valor.split("-");
    return dia && mes && ano ? `${dia}/${mes}/${ano}` : data;
}

function badgeMonitoramento(status) {
    if (status === "Atrasado") return "bg-danger";
    if (status === "Risco") return "bg-warning text-dark";
    return "bg-success";
}

function normalizarProgresso(valor) {
    const numero = Number(valor);
    if (!Number.isFinite(numero)) return 0;
    return Math.min(100, Math.max(0, Math.round(numero)));
}

function Projetos() {
    const token = localStorage.getItem("token");
    const usuario = JSON.parse(localStorage.getItem("usuario") || "null");

    const [projetos, setProjetos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [tarefas, setTarefas] = useState([]);
    const [projeto, setProjeto] = useState(projetoInicial);
    const [editandoId, setEditandoId] = useState(null);
    const [categoria, setCategoria] = useState({ nome: "", descricao: "" });
    const [editandoCategoriaId, setEditandoCategoriaId] = useState(null);
    const [mostrarCategoria, setMostrarCategoria] = useState(false);
    const [detalhe, setDetalhe] = useState(null);
    const [mensagem, setMensagem] = useState("");
    const [erro, setErro] = useState("");
    const [carregando, setCarregando] = useState(true);

    const podeGerenciar = ["administrador", "diretor", "mobilizador"].includes(usuario?.nivel_acesso);

    async function requisicao(url, opcoes = {}) {
        const resposta = await fetch(`${API}${url}`, {
            ...opcoes,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                ...(opcoes.headers || {})
            }
        });
        const dados = await resposta.json();
        if (!resposta.ok) throw new Error(dados.mensagem || "Erro na operação.");
        return dados;
    }

    async function carregarTudo() {
        try {
            setCarregando(true);
            const [projetosDados, categoriasDados, usuariosDados, tarefasDados] = await Promise.all([
                requisicao("/projetos"),
                requisicao("/projetos/categorias"),
                requisicao("/usuarios"),
                requisicao("/tasks")
            ]);
            setProjetos(projetosDados);
            setCategorias(categoriasDados);
            setUsuarios(usuariosDados);
            setTarefas(tarefasDados);
        } catch (e) {
            setErro(e.message);
        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        if (podeGerenciar) carregarTudo();
    }, []);

    const tarefasDisponiveis = useMemo(() => tarefas, [tarefas]);

    function limparMensagens() {
        setErro("");
        setMensagem("");
    }

    function limparProjeto() {
        setProjeto(projetoInicial);
        setEditandoId(null);
    }

    async function editarProjeto(id) {
        try {
            limparMensagens();
            const dados = await requisicao(`/projetos/${id}`);
            setProjeto({
                nome: dados.nome || "",
                descricao: dados.descricao || "",
                objetivo: dados.objetivo || "",
                documentos_necessarios: dados.documentos_necessarios || "",
                data_inicio: dados.data_inicio ? String(dados.data_inicio).slice(0, 10) : "",
                data_fim: dados.data_fim ? String(dados.data_fim).slice(0, 10) : "",
                status: dados.status || "Planejamento",
                id_categoria: dados.id_categoria || "",
                responsavel_id: dados.responsavel_id || "",
                tarefas: (dados.tarefas || []).map((t) => t.id)
            });
            setEditandoId(id);
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (e) {
            setErro(e.message);
        }
    }

    async function salvarProjeto(e) {
        e.preventDefault();
        limparMensagens();

        if (!projeto.nome.trim() || !projeto.id_categoria) {
            setErro("Informe o nome e a categoria do projeto.");
            return;
        }

        try {
            const url = editandoId ? `/projetos/${editandoId}` : "/projetos";
            const dados = await requisicao(url, {
                method: editandoId ? "PUT" : "POST",
                body: JSON.stringify(projeto)
            });
            setMensagem(dados.mensagem);
            limparProjeto();
            await carregarTudo();
        } catch (e) {
            setErro(e.message);
        }
    }

    async function excluirProjeto(id, nome) {
        if (!window.confirm(`Deseja realmente excluir o projeto "${nome}"?`)) return;
        try {
            limparMensagens();
            const dados = await requisicao(`/projetos/${id}`, { method: "DELETE" });
            setMensagem(dados.mensagem);
            if (detalhe?.id_projeto === id) setDetalhe(null);
            await carregarTudo();
        } catch (e) {
            setErro(e.message);
        }
    }

    async function salvarCategoria(e) {
        e.preventDefault();
        limparMensagens();
        try {
            const url = editandoCategoriaId
                ? `/projetos/categorias/${editandoCategoriaId}`
                : "/projetos/categorias";
            const dados = await requisicao(url, {
                method: editandoCategoriaId ? "PUT" : "POST",
                body: JSON.stringify(categoria)
            });
            setMensagem(dados.mensagem);
            setCategoria({ nome: "", descricao: "" });
            setEditandoCategoriaId(null);
            await carregarTudo();
        } catch (e) {
            setErro(e.message);
        }
    }

    async function excluirCategoria(id, nome) {
        if (!window.confirm(`Excluir a categoria "${nome}"?`)) return;
        try {
            limparMensagens();
            const dados = await requisicao(`/projetos/categorias/${id}`, { method: "DELETE" });
            setMensagem(dados.mensagem);
            await carregarTudo();
        } catch (e) {
            setErro(e.message);
        }
    }

    function selecionarTarefa(id) {
        setProjeto((anterior) => ({
            ...anterior,
            tarefas: anterior.tarefas.includes(Number(id))
                ? anterior.tarefas.filter((tarefaId) => tarefaId !== Number(id))
                : [...anterior.tarefas, Number(id)]
        }));
    }

    async function abrirMonitoramento(id) {
        try {
            limparMensagens();
            const dados = await requisicao(`/projetos/${id}/monitoramento`);
            setDetalhe(dados);
        } catch (e) {
            setErro(e.message);
        }
    }

    if (!podeGerenciar) {
        return (
            <div className="container py-5 page-container">
                <div className="alert alert-warning">Você não possui permissão para acessar o gerenciamento de projetos.</div>
            </div>
        );
    }

    return (
        <div className="container py-4 page-container">
            <div className="page-heading">
                <div>
                    <span className="eyebrow">ÁREA DE MOBILIZAÇÃO</span>
                    <h1>Gerenciar projetos</h1>
                    <p>Estruture projetos, organize categorias e acompanhe o andamento pelas tarefas vinculadas.</p>
                </div>
                <Link to="/dashboard" className="btn btn-outline-primary">← Voltar para Dashboard</Link>
            </div>

            {erro && <div className="alert alert-danger">{erro}</div>}
            {mensagem && <div className="alert alert-success">{mensagem}</div>}

            <div className="row g-4 mb-4">
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <small className="text-muted">PROJETOS</small>
                            <h2 className="mt-2 mb-0">{projetos.length}</h2>
                            <span className="text-muted">projetos cadastrados</span>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <small className="text-muted">EM ANDAMENTO</small>
                            <h2 className="mt-2 mb-0">{projetos.filter((p) => p.status === "Em andamento").length}</h2>
                            <span className="text-muted">projetos em execução</span>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <small className="text-muted">MONITORAMENTO</small>
                            <h2 className="mt-2 mb-0">{projetos.filter((p) => p.monitoramento !== "Conforme").length}</h2>
                            <span className="text-muted">com atenção necessária</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                            <h5 className="mb-1">{editandoId ? "Editar projeto" : "Estruturar novo projeto"}</h5>
                            <p className="text-muted mb-0">RF_F4 — informações necessárias para execução do projeto.</p>
                        </div>
                        {editandoId && <button className="btn btn-outline-secondary" onClick={limparProjeto}>Cancelar edição</button>}
                    </div>

                    <form onSubmit={salvarProjeto}>
                        <div className="row g-3">
                            <div className="col-md-8">
                                <label className="form-label">Nome do projeto *</label>
                                <input className="form-control" value={projeto.nome} onChange={(e) => setProjeto({ ...projeto, nome: e.target.value })} required />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label">Categoria *</label>
                                <select className="form-select" value={projeto.id_categoria} onChange={(e) => setProjeto({ ...projeto, id_categoria: e.target.value })} required>
                                    <option value="">Selecione...</option>
                                    {categorias.map((c) => <option key={c.id_categoria} value={c.id_categoria}>{c.nome}</option>)}
                                </select>
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Descrição</label>
                                <textarea className="form-control" rows="3" value={projeto.descricao} onChange={(e) => setProjeto({ ...projeto, descricao: e.target.value })} />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Objetivo</label>
                                <textarea className="form-control" rows="3" value={projeto.objetivo} onChange={(e) => setProjeto({ ...projeto, objetivo: e.target.value })} />
                            </div>
                            <div className="col-md-12">
                                <label className="form-label">Documentos necessários</label>
                                <textarea className="form-control" rows="2" placeholder="Ex.: plano de ação, autorização, lista de materiais..." value={projeto.documentos_necessarios} onChange={(e) => setProjeto({ ...projeto, documentos_necessarios: e.target.value })} />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label">Data de início</label>
                                <input type="date" className="form-control" value={projeto.data_inicio} onChange={(e) => setProjeto({ ...projeto, data_inicio: e.target.value })} />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label">Data de término</label>
                                <input type="date" className="form-control" value={projeto.data_fim} onChange={(e) => setProjeto({ ...projeto, data_fim: e.target.value })} />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label">Status</label>
                                <select className="form-select" value={projeto.status} onChange={(e) => setProjeto({ ...projeto, status: e.target.value })}>
                                    <option>Planejamento</option>
                                    <option>Em andamento</option>
                                    <option>Concluído</option>
                                    <option>Suspenso</option>
                                </select>
                            </div>
                            <div className="col-md-3">
                                <label className="form-label">Responsável</label>
                                <select className="form-select" value={projeto.responsavel_id} onChange={(e) => setProjeto({ ...projeto, responsavel_id: e.target.value })}>
                                    <option value="">Não definido</option>
                                    {usuarios.map((u) => <option key={u.id_usuario} value={u.id_usuario}>{u.nome} — {u.nivel_acesso}</option>)}
                                </select>
                            </div>

                            <div className="col-md-12">
                                <label className="form-label">Tarefas vinculadas</label>
                                <div className="border rounded p-3" style={{ maxHeight: 220, overflowY: "auto" }}>
                                    {tarefasDisponiveis.length === 0 ? (
                                        <span className="text-muted">Nenhuma tarefa cadastrada.</span>
                                    ) : tarefasDisponiveis.map((tarefa) => (
                                        <div className="form-check mb-2" key={tarefa.id}>
                                            <input className="form-check-input" type="checkbox" checked={projeto.tarefas.includes(Number(tarefa.id))} onChange={() => selecionarTarefa(tarefa.id)} id={`tarefa-${tarefa.id}`} />
                                            <label className="form-check-label" htmlFor={`tarefa-${tarefa.id}`}>
                                                <strong>{tarefa.title}</strong> — {tarefa.status} ({tarefa.progresso}%)
                                            </label>
                                        </div>
                                    ))}
                                </div>
                                <small className="text-muted">O RF_F5 usa essas tarefas para calcular progresso e identificar atrasos/risco.</small>
                            </div>
                        </div>

                        <div className="mt-4">
                            <button className="btn btn-primary" type="submit">{editandoId ? "Salvar alterações" : "Cadastrar projeto"}</button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                            <h5 className="mb-1">Categorias de projeto</h5>
                            <p className="text-muted mb-0">RF_B2 — organização e classificação dos projetos.</p>
                        </div>
                        <button className="btn btn-outline-primary" onClick={() => setMostrarCategoria(!mostrarCategoria)}>
                            {mostrarCategoria ? "Fechar" : "Gerenciar categorias"}
                        </button>
                    </div>

                    {mostrarCategoria && (
                        <div className="row g-4">
                            <div className="col-lg-5">
                                <form onSubmit={salvarCategoria}>
                                    <label className="form-label">Nome da categoria *</label>
                                    <input className="form-control mb-3" value={categoria.nome} onChange={(e) => setCategoria({ ...categoria, nome: e.target.value })} required />
                                    <label className="form-label">Descrição</label>
                                    <textarea className="form-control mb-3" rows="3" value={categoria.descricao} onChange={(e) => setCategoria({ ...categoria, descricao: e.target.value })} />
                                    <button className="btn btn-primary me-2">{editandoCategoriaId ? "Salvar categoria" : "Adicionar categoria"}</button>
                                    {editandoCategoriaId && <button type="button" className="btn btn-outline-secondary" onClick={() => { setEditandoCategoriaId(null); setCategoria({ nome: "", descricao: "" }); }}>Cancelar</button>}
                                </form>
                            </div>
                            <div className="col-lg-7">
                                <div className="table-responsive">
                                    <table className="table align-middle">
                                        <thead><tr><th>Categoria</th><th>Projetos</th><th>Ações</th></tr></thead>
                                        <tbody>
                                            {categorias.map((c) => (
                                                <tr key={c.id_categoria}>
                                                    <td><strong>{c.nome}</strong><br /><small className="text-muted">{c.descricao || "Sem descrição"}</small></td>
                                                    <td>{c.quantidade_projetos}</td>
                                                    <td>
                                                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => { setEditandoCategoriaId(c.id_categoria); setCategoria({ nome: c.nome, descricao: c.descricao || "" }); }}>Editar</button>
                                                        <button className="btn btn-sm btn-outline-danger" onClick={() => excluirCategoria(c.id_categoria, c.nome)}>Excluir</button>
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

            <div className="card border-0 shadow-sm">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                            <h5 className="mb-1">Projetos cadastrados</h5>
                            <p className="text-muted mb-0">RF_F5 — monitoramento consolidado por tarefas e prazos.</p>
                        </div>
                    </div>

                    {carregando ? <p className="text-muted">Carregando projetos...</p> : projetos.length === 0 ? <div className="alert alert-info">Nenhum projeto cadastrado.</div> : (
                        <div className="table-responsive">
                            <table className="table align-middle">
                                <thead>
                                    <tr>
                                        <th>Projeto</th><th>Categoria</th><th>Responsável</th><th>Prazo</th><th>Progresso</th><th>Monitoramento</th><th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {projetos.map((p) => (
                                        <tr key={p.id_projeto}>
                                            <td><strong>{p.nome}</strong><br /><small className="text-muted">{p.status}</small></td>
                                            <td>{p.categoria_nome}</td>
                                            <td>{p.responsavel_nome || "Não definido"}</td>
                                            <td>{formatarData(p.data_fim)}</td>
                                            <td style={{ minWidth: 130 }}>
                                                <div className="progress" style={{ height: 8 }}><div className="progress-bar" style={{ width: `${p.progresso_medio || 0}%` }} /></div>
                                                <small>{p.progresso_medio || 0}% — {p.tarefas_concluidas || 0}/{p.total_tarefas || 0} concluídas</small>{Number(p.tarefas_atrasadas) > 0 && <small className="d-block text-danger">{p.tarefas_atrasadas} tarefa(s) atrasada(s)</small>}
                                            </td>
                                            <td><span className={`badge ${badgeMonitoramento(p.monitoramento)}`}>{p.monitoramento}</span></td>
                                            <td className="text-nowrap">
                                                <button className="btn btn-sm btn-outline-info me-1" onClick={() => abrirMonitoramento(p.id_projeto)}>Monitorar</button>
                                                <button className="btn btn-sm btn-outline-primary me-1" onClick={() => editarProjeto(p.id_projeto)}>Editar</button>
                                                <button className="btn btn-sm btn-outline-danger" onClick={() => excluirProjeto(p.id_projeto, p.nome)}>Excluir</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {detalhe && (
                <div className="card border-0 shadow-sm mt-4">
                    <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <span className="eyebrow">RF_F5</span>
                                <h4 className="mb-1">Monitoramento: {detalhe.nome}</h4>
                                <p className="text-muted mb-0">Visão consolidada das tarefas vinculadas e dos prazos.</p>
                            </div>
                            <button className="btn btn-outline-secondary" onClick={() => setDetalhe(null)}>Fechar</button>
                        </div>
                        <hr />
                        <div className="row g-3">
                            <div className="col-md-3">
                                <strong>Progresso das tarefas</strong>
                                {(() => {
                                    const progresso = normalizarProgresso(detalhe.progresso_medio);
                                    return (
                                        <>
                                            <div className="fs-3">{progresso}%</div>
                                            <div className="progress mt-2" style={{ height: 10 }}>
                                                <div className="progress-bar" role="progressbar" style={{ width: `${progresso}%` }} aria-valuenow={progresso} aria-valuemin="0" aria-valuemax="100" />
                                            </div>
                                            <small className="text-muted">Média do progresso das tarefas vinculadas.</small>
                                        </>
                                    );
                                })()}
                            </div>
                            <div className="col-md-3"><strong>Tarefas</strong><div className="fs-3">{detalhe.total_tarefas}</div><small>{detalhe.concluidas} concluídas</small></div>
                            <div className="col-md-3"><strong>Tarefas atrasadas</strong><div className="fs-3">{detalhe.atrasadas}</div><small className="text-muted">Atraso de tarefa não torna o projeto atrasado.</small></div>
                            <div className="col-md-3"><strong>Situação</strong><div className="mt-2"><span className={`badge ${badgeMonitoramento(detalhe.monitoramento)}`}>{detalhe.monitoramento}</span></div></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Projetos;
