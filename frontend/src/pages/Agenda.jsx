import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

import FormularioAgenda from '../components/FormularioAgenda';
import TabelaAgenda from '../components/TabelaAgenda';

function Agenda() {

  const [lista, setLista] = useState([]);
  const [editando, setEditando] = useState(null);
  const [filtro, setFiltro] = useState('');

  const token = localStorage.getItem('token');

  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  async function carregarRegistros() {
    try {

      const resposta = await axios.get(
        `http://localhost:3000/agendamentos?membro=${filtro}`,
        config
      );

      const listaOrdenada = [...resposta.data].sort((a, b) =>
        a.membro.localeCompare(b.membro, 'pt-BR')
      );

      setLista(listaOrdenada);

    } catch (erro) {

      console.error('Erro ao carregar agendamentos:', erro);

      if (erro.response?.status === 401) {
        alert('Sessão expirada. Faça login novamente.');
      } else {
        alert('Erro ao carregar os agendamentos.');
      }
    }
  }

  useEffect(() => {
    carregarRegistros();
  }, [filtro]);

  async function adicionarRegistro(registro) {

    try {

      await axios.post(
        'http://localhost:3000/agendamentos',
        registro,
        config
      );

      alert('Registro cadastrado com sucesso!');

      carregarRegistros();

    } catch (erro) {
  console.log("ERRO COMPLETO:", erro);
  console.log("STATUS:", erro.response?.status);
  console.log("RESPOSTA DO BACKEND:", erro.response?.data);
  console.log("DADOS ENVIADOS:", registro);

  if (erro.response?.status === 400) {
    alert(
      erro.response?.data?.erro ||
      erro.response?.data?.mensagem ||
      "Erro 400 ao cadastrar."
    );
  } else if (erro.response?.status === 401) {
    alert("Sessão expirada. Faça login novamente.");
  } else {
    alert("Erro ao cadastrar registro.");
  }
}
  }

  async function excluirRegistro(id) {

    const confirmar = window.confirm(
      'Deseja realmente excluir este registro?'
    );

    if (!confirmar) {
      return;
    }

    try {

      await axios.delete(
        `http://localhost:3000/agendamentos/${id}`,
        config
      );

      alert('Registro excluído');

      carregarRegistros();

    } catch (erro) {

      console.error(erro);

      if (erro.response?.status === 401) {
        alert('Sessão expirada. Faça login novamente.');
      } else {
        alert('Erro ao excluir registro.');
      }
    }
  }

  function editarRegistro(item) {
    setEditando(item);
  }

  async function atualizarRegistro(registroAtualizado) {

    try {

      await axios.put(
        `http://localhost:3000/agendamentos/${editando.id}`,
        registroAtualizado,
        config
      );

      alert('Registro atualizado com sucesso!');

      setEditando(null);

      carregarRegistros();

    } catch (erro) {

      if (erro.response?.status === 400) {

        alert(
          erro.response.data?.erro ||
          erro.response.data?.mensagem ||
          'Este membro já possui disponibilidade nesse horário.'
        );

      } else if (erro.response?.status === 401) {

        alert('Sessão expirada. Faça login novamente.');

      } else {

        console.error(erro);

        alert('Erro ao atualizar registro.');

      }
    }
  }

  return (
    <div className="container mt-4">

      <div className="d-flex justify-content-between align-items-start">

        <div>
          <h1 className="titulo">
            AGENDA
          </h1>

          <p className="subtitulo">
            Gerenciamento de disponibilidade
          </p>
        </div>

        <Link to="/dashboard" className="btn btn-outline-primary" > ← Voltar para Dashboard </Link>

      </div>

      <div className="container-box">

        <div className="mb-3">

          <input
            type="text"
            className="form-control"
            placeholder="Filtrar por nome do membro"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />

        </div>

        <FormularioAgenda
          adicionarRegistro={adicionarRegistro}
          atualizarRegistro={atualizarRegistro}
          editando={editando}
        />

        <TabelaAgenda
          lista={lista}
          excluirRegistro={excluirRegistro}
          editarRegistro={editarRegistro}
        />

      </div>

    </div>
  );
}

export default Agenda;
