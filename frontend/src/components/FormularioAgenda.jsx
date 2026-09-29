import { useState, useEffect } from "react";
import axios from "axios";
import "../styles.css";

function Formulario({
  adicionarRegistro,
  atualizarRegistro,
  editando
}) {
  const [idUsuario, setIdUsuario] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [data, setData] = useState("");
  const [horarioInicio, setHorarioInicio] = useState("");
  const [horarioFim, setHorarioFim] = useState("");
  const [status, setStatus] = useState("Disponível");

  const token = localStorage.getItem("token");

  useEffect(() => {
    carregarUsuarios();
  }, []);

  async function carregarUsuarios() {
    try {
      const resposta = await axios.get(
        "http://localhost:3000/usuarios",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setUsuarios(resposta.data);
    } catch (erro) {
      console.error("Erro ao carregar usuários:", erro);
      alert("Erro ao carregar os usuários.");
    }
  }

  useEffect(() => {
    if (editando) {
      setIdUsuario(editando.id_usuario);
      setData(
        editando.data
          ? editando.data.split("T")[0]
          : ""
      );
      setHorarioInicio(editando.horarioInicio);
      setHorarioFim(editando.horarioFim);
      setStatus(editando.status);
    } else {
      limparFormulario();
    }
  }, [editando]);

  function salvar(e) {
    e.preventDefault();
   

    if (horarioInicio && horarioFim && horarioFim <= horarioInicio) {
  alert("O horário final deve ser maior que o inicial!");
  return;
}

    const registro = {
    id_usuario: idUsuario ? Number(idUsuario) : null,
    data: data || null,
    horarioInicio: horarioInicio || null,
    horarioFim: horarioFim || null,
    status: status || null
    };

    if (editando) {
      atualizarRegistro(registro);
    } else {
      adicionarRegistro(registro);
    }

    limparFormulario();
  }

  function limparFormulario() {
    setIdUsuario("");
    setData("");
    setHorarioInicio("");
    setHorarioFim("");
    setStatus("Disponível");
  }

  return (
    <div className="card-custom">

      <h5 className="fw-bold mb-4">
        NOVA DISPONIBILIDADE
      </h5>

      <form onSubmit={salvar}>

        <div className="row">

          <div className="col-md-3 mb-3">

            <label className="form-label">
              Membro
            </label>

            <select
              className="form-select"
              value={idUsuario}
              onChange={(e) =>
                setIdUsuario(e.target.value)
              }
            >

              <option value="">
                Selecione um usuário
              </option>

              {usuarios.map((usuario) => (
                <option
                  key={usuario.id_usuario}
                  value={usuario.id_usuario}
                >
                  {usuario.nome}
                </option>
              ))}

            </select>

          </div>

          <div className="col-md-3 mb-3">

            <label className="form-label">
              Data
            </label>

            <input
              type="date"
              className="form-control"
              value={data}
              onChange={(e) =>
                setData(e.target.value)
              }
            />

          </div>

          <div className="col-md-3 mb-3">

            <label className="form-label">
              Horário Inicial
            </label>

            <input
              type="time"
              className="form-control"
              value={horarioInicio}
              onChange={(e) =>
                setHorarioInicio(e.target.value)
              }
            />

          </div>

          <div className="col-md-3 mb-3">

            <label className="form-label">
              Horário Final
            </label>

            <input
              type="time"
              className="form-control"
              value={horarioFim}
              onChange={(e) =>
                setHorarioFim(e.target.value)
              }
            />

          </div>

          <div className="col-md-3 mb-3">

            <label className="form-label">
              Status
            </label>

            <select
              className="form-select"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value)
              }
            >
              <option value="Disponível">
                Disponível
              </option>

              <option value="Indisponível">
                Indisponível
              </option>

            </select>

          </div>

        </div>

        <button className="btn btn-success">
          {editando ? "Atualizar" : "Salvar"}
        </button>

      </form>

    </div>
  );
}

export default Formulario;
