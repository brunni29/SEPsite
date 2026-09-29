import { useEffect, useState } from "react";
import axios from "axios";
import MembroForm from "../components/MembroForm";
import { Link } from 'react-router-dom';

function Membros() {
    const [membros, setMembros] = useState([]);
    const [editando, setEditando] = useState(null);
    const [busca, setBusca] = useState("");

    const API = "http://localhost:3000";

    const carregarMembros = async () => {
        try {
            const token = localStorage.getItem("token");

            const resposta = await axios.get(
                `${API}/membros`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setMembros(resposta.data);

        } catch (erro) {
            console.error("Erro ao carregar membros:", erro);

            if (erro.response?.status === 401) {
                alert("Sessão expirada. Faça login novamente.");
            } else if (erro.response?.status === 403) {
                alert("Você não tem permissão para acessar os membros.");
            } else {
                alert("Erro ao carregar membros.");
            }
        }
    };

    useEffect(() => {
        carregarMembros();
    }, []);

    const aoSalvar = async (membro) => {
        try {
            const token = localStorage.getItem("token");

            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };

            if (editando) {
                await axios.put(
                    `${API}/membros/${editando.id}`,
                    membro,
                    config
                );

                alert("Membro atualizado com sucesso!");

            } else {
                await axios.post(
                    `${API}/membros`,
                    membro,
                    config
                );

                alert("Membro cadastrado com sucesso!");
            }

            setEditando(null);

            await carregarMembros();

        } catch (erro) {
            console.error("Erro ao salvar membro:", erro);

            const mensagem =
                erro.response?.data?.erro ||
                erro.response?.data?.mensagem ||
                "Erro ao salvar membro.";

            alert(mensagem);
        }
    };

    const cancelar = () => {
        setEditando(null);
    };

    const excluirMembro = async (id) => {
        if (!window.confirm("Deseja realmente excluir este membro?")) {
            return;
        }

        try {
            const token = localStorage.getItem("token");

            await axios.delete(
                `${API}/membros/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            alert("Membro excluído com sucesso!");

            carregarMembros();

        } catch (erro) {
            console.error("Erro ao excluir membro:", erro);

            const mensagem =
                erro.response?.data?.erro ||
                erro.response?.data?.mensagem ||
                "Erro ao excluir membro.";

            alert(mensagem);
        }
    };

    const membrosFiltrados = membros.filter((m) => {
        const termo = busca.toLowerCase();

        return (
            m.nome?.toLowerCase().includes(termo) ||
            m.cpf?.toLowerCase().includes(termo) ||
            m.diretoria?.toLowerCase().includes(termo) ||
            m.telefone?.toLowerCase().includes(termo)
        );
    });

    return (
        <div className="container py-5">

            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="mb-0">
                    Gerenciar Membros
                </h1>

            <Link
                to="/dashboard"
                className="btn btn-outline-primary"
            >
                ← Voltar para Dashboard
            </Link>
        </div>

            <MembroForm
                aoSalvar={aoSalvar}
                editando={editando}
                cancelar={cancelar}
            />

            <hr />

            <h2 className="mb-3">
                Lista de Membros
            </h2>

            <input
                type="text"
                className="form-control mb-4"
                placeholder="Buscar por nome, CPF, diretoria ou telefone"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
            />

            <div className="table-responsive">

                <table className="table table-bordered table-hover align-middle">

                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>CPF</th>
                            <th>Telefone</th>
                            <th>Diretoria</th>
                            <th>Cargo</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>

                    <tbody>

                        {membrosFiltrados.length === 0 ? (

                            <tr>
                                <td
                                    colSpan="7"
                                    className="text-center"
                                >
                                    Nenhum membro encontrado.
                                </td>
                            </tr>

                        ) : (

                            membrosFiltrados.map((membro) => (

                                <tr key={membro.id}>

                                    <td>
                                        {membro.nome}
                                    </td>

                                    <td>
                                        {membro.cpf}
                                    </td>

                                    <td>
                                        {membro.telefone}
                                    </td>

                                    <td>
                                        {membro.diretoria}
                                    </td>

                                    <td>
                                        {membro.cargo || "-"}
                                    </td>

                                    <td>
                                        {membro.status || "-"}
                                    </td>

                                    <td>

                                        <div className="d-flex gap-2">

                                            <button
                                                className="btn btn-warning btn-sm"
                                                onClick={() =>
                                                    setEditando(membro)
                                                }
                                            >
                                                Editar
                                            </button>

                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() =>
                                                    excluirMembro(membro.id)
                                                }
                                            >
                                                Excluir
                                            </button>

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

export default Membros;
