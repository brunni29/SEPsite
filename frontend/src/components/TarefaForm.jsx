import { useEffect, useState } from "react";

const estadoInicial = {
    title: "",
    description: "",
    deadline: "",
    status: "Pendente",
    responsavel_id: "",
    prioridade: "Média",
    progresso: 0
};

function TarefaForm({
    aoSalvar,
    editando,
    cancelar,
    usuarios,
    podeGerenciar
}) {
    const [tarefa, setTarefa] = useState(estadoInicial);

    useEffect(() => {
        if (editando) {
            setTarefa({
                ...estadoInicial,
                ...editando,
                deadline: editando.deadline
                    ? String(editando.deadline).split("T")[0]
                    : "",
                responsavel_id: editando.responsavel_id || "",
                progresso: editando.progresso ?? 0
            });
        } else {
            setTarefa(estadoInicial);
        }
    }, [editando]);

    function alterar(campo, valor) {
        setTarefa((anterior) => {
            const novaTarefa = {
                ...anterior,
                [campo]: valor
            };

            if (campo === "progresso" && Number(valor) === 100) {
                novaTarefa.status = "Concluído";
            }

            if (campo === "status" && valor === "Concluído") {
                novaTarefa.progresso = 100;
            }

            return novaTarefa;
        });
    }

    async function enviar(e) {
        e.preventDefault();

        if (podeGerenciar && tarefa.title.trim().length < 3) {
            alert("O título deve possuir no mínimo 3 caracteres.");
            return;
        }

        let dadosParaSalvar;

        if (podeGerenciar) {
            dadosParaSalvar = {
                ...tarefa,
                progresso: Number(tarefa.progresso)
            };
        } else {
            dadosParaSalvar = {
                status: tarefa.status,
                progresso: Number(tarefa.progresso)
            };
        }

        await aoSalvar(dadosParaSalvar);

        if (!editando) {
            setTarefa(estadoInicial);
        }
    }

    return (
        <div className="card shadow-sm border-0 mb-4">

            <div
                className="card-header text-white"
                style={{ backgroundColor: "#045148" }}
            >
                <h5 className="mb-0">
                    {editando
                        ? "Atualizar Tarefa"
                        : "Nova Tarefa"}
                </h5>
            </div>

            <div className="card-body">

                {!podeGerenciar && editando && (
                    <div className="alert alert-info">
                        Como membro, você pode atualizar somente o
                        <strong> status </strong>
                        e o
                        <strong> progresso </strong>
                        da tarefa.
                    </div>
                )}

                <form onSubmit={enviar} className="row g-3">

                    {/* TÍTULO */}
                    <div className="col-md-6">
                        <label className="form-label fw-bold">
                            Título *
                        </label>

                        <input
                            className="form-control"
                            value={tarefa.title}
                            onChange={(e) =>
                                alterar("title", e.target.value)
                            }
                            required={podeGerenciar}
                            disabled={!podeGerenciar}
                        />
                    </div>

                    {/* RESPONSÁVEL */}
                    <div className="col-md-3">
                        <label className="form-label fw-bold">
                            Responsável
                        </label>

                        <select
                            className="form-select"
                            value={tarefa.responsavel_id}
                            onChange={(e) =>
                                alterar(
                                    "responsavel_id",
                                    e.target.value
                                )
                            }
                            disabled={!podeGerenciar}
                        >
                            <option value="">
                                Sem responsável
                            </option>

                            {usuarios.map((usuario) => (
                                <option
                                    key={usuario.id_usuario}
                                    value={usuario.id_usuario}
                                >
                                    {usuario.nome} —{" "}
                                    {usuario.nivel_acesso}
                                </option>
                            ))}
                        </select>
                    </div>

                    
                    <div className="col-md-3">
                        <label className="form-label fw-bold">
                            Prazo
                        </label>

                        <input
                            type="date"
                            className="form-control"
                            value={tarefa.deadline}
                            onChange={(e) =>
                                alterar(
                                    "deadline",
                                    e.target.value
                                )
                            }
                            disabled={!podeGerenciar}
                        />
                    </div>

                    
                    <div className="col-md-6">
                        <label className="form-label fw-bold">
                            Descrição
                        </label>

                        <textarea
                            className="form-control"
                            rows="3"
                            value={tarefa.description || ""}
                            onChange={(e) =>
                                alterar(
                                    "description",
                                    e.target.value
                                )
                            }
                            disabled={!podeGerenciar}
                        />
                    </div>

                    
                    <div className="col-md-2">
                        <label className="form-label fw-bold">
                            Status
                        </label>

                        <select
                            className="form-select"
                            value={tarefa.status}
                            onChange={(e) =>
                                alterar(
                                    "status",
                                    e.target.value
                                )
                            }
                        >
                            <option>Pendente</option>
                            <option>Em andamento</option>
                            <option>Urgente</option>
                            <option>Concluído</option>
                        </select>
                    </div>

                    
                    <div className="col-md-2">
                        <label className="form-label fw-bold">
                            Prioridade
                        </label>

                        <select
                            className="form-select"
                            value={tarefa.prioridade}
                            onChange={(e) =>
                                alterar(
                                    "prioridade",
                                    e.target.value
                                )
                            }
                            disabled={!podeGerenciar}
                        >
                            <option>Baixa</option>
                            <option>Média</option>
                            <option>Alta</option>
                            <option>Urgente</option>
                        </select>
                    </div>

                    
                    <div className="col-md-2">
                        <label className="form-label fw-bold">
                            Progresso (%)
                        </label>

                        <input
                            type="number"
                            className="form-control"
                            min="0"
                            max="100"
                            value={tarefa.progresso}
                            onChange={(e) =>
                                alterar(
                                    "progresso",
                                    e.target.value
                                )
                            }
                        />
                    </div>

                    
                    <div className="col-12 d-flex gap-2">

                        <button
                            type="submit"
                            className="btn text-white"
                            style={{
                                backgroundColor: "#DA5321"
                            }}
                        >
                            {editando
                                ? "Salvar alterações"
                                : "Cadastrar tarefa"}
                        </button>

                        {editando && (
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={cancelar}
                            >
                                Cancelar
                            </button>
                        )}

                    </div>

                </form>
            </div>
        </div>
    );
}

export default TarefaForm;