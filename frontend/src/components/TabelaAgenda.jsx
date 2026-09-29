import { useEffect, useState } from "react";

const API = "http://localhost:3000";

function formatarData(data) {
  if (!data) return '';
  const dataLimpa = data.split('T')[0];
  const [ano, mes, dia] = dataLimpa.split('-');
  return `${dia}/${mes}/${ano}`;
}

function Tabela({
  lista,
  excluirRegistro,
  editarRegistro
}) {

  return (
    <div className="card-custom">

      <h5 className="fw-bold mb-4">
        REGISTROS DE DISPONIBILIDADE
      </h5>

      <table className="table">

        <thead>
          <tr>
            <th>Membro</th>
            <th>Data</th>
            <th>Horário</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>

        <tbody>

          {lista.map((item) => (

            <tr key={item.id}>

              <td>{item.membro}</td>

              <td>{formatarData(item.data)}</td>

              <td>
                {item.horarioInicio}
                {' às '}
                {item.horarioFim}
              </td>

              <td>
                <span
                  className={
                    item.status === 'Disponível'
                      ? 'badge badge-disponivel'
                      : 'badge badge-indisponivel'
                  }
                >
                  {item.status}
                </span>
              </td>

              <td>

                <button
                  className="btn btn-warning btn-sm me-2"
                  onClick={() => editarRegistro(item)}
                >
                  Editar
                </button>

                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => excluirRegistro(item.id)}
                >
                  Excluir
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}

export default Tabela;