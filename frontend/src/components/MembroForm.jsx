import React, { useState, useEffect } from 'react';

const MembroForm = ({ aoSalvar, editando, cancelar }) => {

const estadoInicial = {
nome: '',
email: '',
dataNascimento: '',
diretoria: '',
cargo: '',
status: 'Ativo',
cpf: '',
telefone: '',
cep: '',
endereco: '',
numeroCasa: ''
};

const [membro, setMembro] = useState(estadoInicial);

useEffect(() => {
if (editando) {
setMembro({
...estadoInicial,
...editando
});
} else {
setMembro(estadoInicial);
}
}, [editando]);

const aplicarMascaraCPF = (valor) => {
return valor
.replace(/\D/g, '')
.replace(/(\d{3})(\d)/, '$1.$2')
.replace(/(\d{3})(\d)/, '$1.$2')
.replace(/(\d{3})(\d{1,2})$/, '$1-$2')
.substring(0, 14);
};

const aplicarMascaraTelefone = (valor) => {
return valor
.replace(/\D/g, '')
.replace(/(\d{2})(\d)/, '($1) $2')
.replace(/(\d{5})(\d)/, '$1-$2')
.substring(0, 15);
};

const aplicarMascaraCEP = (valor) => {
return valor
.replace(/\D/g, '')
.replace(/(\d{5})(\d)/, '$1-$2')
.substring(0, 9);
};

const calcularIdade = (dataNascimento) => {

const nascimento = new Date(dataNascimento);
const hoje = new Date();

let idade =
  hoje.getFullYear() -
  nascimento.getFullYear();

const mes =
  hoje.getMonth() -
  nascimento.getMonth();

if (
  mes < 0 ||
  (
    mes === 0 &&
    hoje.getDate() <
    nascimento.getDate()
  )
) {
  idade--;
}

return idade;

};

const handleSubmit = async (e) => {

e.preventDefault();

if (membro.nome.trim().length < 3) {
  alert('O nome deve possuir pelo menos 3 caracteres.');
  return;
}

if (!membro.dataNascimento) {
  alert('Informe a data de nascimento.');
  return;
}

if (calcularIdade(membro.dataNascimento) < 16) {
  alert('O membro deve possuir pelo menos 16 anos.');
  return;
}

if (membro.cpf.length !== 14) {
  alert('CPF inválido.');
  return;
}

if (membro.telefone.length < 14) {
  alert('Telefone inválido.');
  return;
}

if (membro.cep && membro.cep.length !== 9) {
  alert('CEP inválido.');
  return;
}

try {

  await aoSalvar(membro);

  if (!editando) {
    setMembro(estadoInicial);
  }

} catch (erro) {

  console.error(erro);

  alert(
    erro?.response?.data?.erro ||
    'Erro ao salvar membro.'
  );
}

};

return (
<div
className="card shadow-sm border-0 mb-4"
style={{
borderRadius: '15px'
}}
>

  <div
    className="card-header text-white"
    style={{
      backgroundColor: '#045148'
    }}
  >
    <h5 className="mb-0">
      {editando
        ? 'Atualizar Membro'
        : 'Novo Membro'}
    </h5>
  </div>

  <div className="card-body">

    <form
      onSubmit={handleSubmit}
      className="row g-3"
    >

      <div className="col-md-3">
        <label className="form-label fw-bold">
          Nome Completo *
        </label>

        <input
          type="text"
          className="form-control"
          value={membro.nome}
          onChange={(e) =>
            setMembro({
              ...membro,
              nome: e.target.value
            })
          }
          required
        />
      </div>

      <div className="col-md-3">
        <label className="form-label fw-bold">
          E-mail *
        </label>

        <input
          type="email"
          className="form-control"
          value={membro.email}
          onChange={(e) =>
            setMembro({
              ...membro,
              email: e.target.value
            })
          }
          required
        />
      </div>

      <div className="col-md-2">
        <label className="form-label fw-bold">
          Data Nascimento *
        </label>

        <input
          type="date"
          className="form-control"
          value={membro.dataNascimento || ''}
          onChange={(e) =>
            setMembro({
              ...membro,
              dataNascimento: e.target.value
            })
          }
          required
        />
      </div>

      <div className="col-md-2">
        <label className="form-label fw-bold">
          CPF *
        </label>

        <input
          type="text"
          className="form-control"
          value={membro.cpf}
          onChange={(e) =>
            setMembro({
              ...membro,
              cpf: aplicarMascaraCPF(e.target.value)
            })
          }
          required
        />
      </div>

      <div className="col-md-2">
        <label className="form-label fw-bold">
          Telefone *
        </label>

        <input
          type="text"
          className="form-control"
          value={membro.telefone}
          onChange={(e) =>
            setMembro({
              ...membro,
              telefone: aplicarMascaraTelefone(e.target.value)
            })
          }
          required
        />
      </div>

      <div className="col-md-2">
        <label className="form-label fw-bold">
          CEP
        </label>

        <input
          type="text"
          className="form-control"
          value={membro.cep}
          onChange={(e) =>
            setMembro({
              ...membro,
              cep: aplicarMascaraCEP(e.target.value)
            })
          }
        />
      </div>

      <div className="col-md-4">
        <label className="form-label fw-bold">
          Endereço
        </label>

        <input
          type="text"
          className="form-control"
          value={membro.endereco}
          onChange={(e) =>
            setMembro({
              ...membro,
              endereco: e.target.value
            })
          }
        />
      </div>

      <div className="col-md-2">
        <label className="form-label fw-bold">
          Nº Casa
        </label>

        <input
          type="text"
          className="form-control"
          value={membro.numeroCasa}
          onChange={(e) =>
            setMembro({
              ...membro,
              numeroCasa: e.target.value
            })
          }
        />
      </div>

      <div className="col-md-2">
        <label className="form-label fw-bold">
          Diretoria *
        </label>

        <select
          className="form-select"
          value={membro.diretoria}
          onChange={(e) =>
            setMembro({
              ...membro,
              diretoria: e.target.value
            })
          }
          required
        >
          <option value="">
            Selecione...
          </option>

          <option value="Mobilização">
            Mobilização
          </option>

          <option value="Projetos">
            Projetos
          </option>

          <option value="Comunicação">
            Comunicação
          </option>

          <option value="Pessoas">
            Pessoas
          </option>
        </select>
      </div>

      <div className="col-md-2 d-flex align-items-end gap-2">

        <button
          type="submit"
          className="btn text-white w-100"
          style={{
            backgroundColor: '#DA5321'
          }}
        >
          {editando
            ? 'Salvar'
            : 'Cadastrar'}
        </button>

        {editando && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={cancelar}
          >
            X
          </button>
        )}

      </div>

    </form>

  </div>

</div>

);
};

export default MembroForm;