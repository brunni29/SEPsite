function TarefaList({ tarefas, editar, excluir, podeGerenciar }) {
    function classeStatus(status) {
        if (status === "Concluído") return "bg-success";
        if (status === "Em andamento") return "bg-primary";
        if (status === "Urgente") return "bg-danger";
        return "bg-secondary";
    }

    function classePrioridade(prioridade) {
        if (prioridade === "Urgente") return "bg-danger";
        if (prioridade === "Alta") return "bg-warning text-dark";
        if (prioridade === "Média") return "bg-info text-dark";
        return "bg-secondary";
    }

    function formatarData(data) {
        if (!data) return "-";
        const valor = String(data).split("T")[0];
        const partes = valor.split("-");
        if (partes.length !== 3) return valor;
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    return (
        <div className="card shadow-sm border-0">
            <div className="card-header" style={{ backgroundColor: "#f5f5ed" }}>
                <h5 className="mb-0">Lista de Tarefas</h5>
            </div>

            <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                    <thead>
                        <tr>
                            <th>Tarefa</th>
                            <th>Responsável</th>
                            <th>Prazo</th>
                            <th>Status</th>
                            <th>Prioridade</th>
                            <th style={{ minWidth: "150px" }}>Progresso</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tarefas.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="text-center py-4">
                                    Nenhuma tarefa encontrada.
                                </td>
                            </tr>
                        ) : (
                            tarefas.map((tarefa) => (
                                <tr key={tarefa.id}>
                                    <td>
                                        <strong>{tarefa.title}</strong>
                                        {tarefa.description && (
                                            <div className="small text-muted mt-1">
                                                {tarefa.description}
                                            </div>
                                        )}
                                    </td>
                                    <td>{tarefa.responsavel_nome || "Sem responsável"}</td>
                                    <td>{formatarData(tarefa.deadline)}</td>
                                    <td>
                                        <span className={`badge ${classeStatus(tarefa.status)}`}>
                                            {tarefa.status}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge ${classePrioridade(tarefa.prioridade)}`}>
                                            {tarefa.prioridade}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="progress" style={{ height: "22px" }}>
                                            <div
                                                className="progress-bar"
                                                role="progressbar"
                                                style={{ width: `${tarefa.progresso || 0}%` }}
                                            >
                                                {tarefa.progresso || 0}%
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="d-flex gap-2">
                                            <button
                                                className="btn btn-warning btn-sm"
                                                onClick={() => editar(tarefa)}
                                            >
                                                Editar
                                            </button>

                                            {podeGerenciar && (
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => excluir(tarefa.id)}
                                                >
                                                    Excluir
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default TarefaList;
