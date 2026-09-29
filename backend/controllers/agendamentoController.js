const conexao = require('../db/conexao');



const listarAgendamentos = async (req, res) => {
  try {
    const { membro, status } = req.query;

    let sql = `
      SELECT
        a.id,
        a.id_usuario,
        u.nome AS membro,
        u.email,
        u.nivel_acesso,
        a.data,
        a.horarioInicio,
        a.horarioFim,
        a.status
      FROM agendamentos a
      LEFT JOIN usuarios u
        ON a.id_usuario = u.id_usuario
      WHERE 1=1
    `;

    const valores = [];

    if (membro && membro.trim() !== '') {
      sql += ' AND u.nome LIKE ?';
      valores.push(`%${membro}%`);
    }

    if (status && status.trim() !== '') {
      sql += ' AND a.status = ?';
      valores.push(status);
    }

    sql += ' ORDER BY u.nome ASC';

    const [dados] = await conexao.query(sql, valores);

    res.json(dados);

  } catch (erro) {
    console.log('Erro ao listar agendamentos:', erro);

    res.status(500).json({
      erro: 'Erro ao buscar registros'
    });
  }
};



const cadastrarAgendamento = async (req, res) => {
  try {

    console.log('================================');
    console.log('CADASTRO DE AGENDAMENTO');
    console.log('BODY RECEBIDO:');
    console.log(req.body);
    console.log('================================');

    const {
      id_usuario,
      data,
      horarioInicio,
      horarioFim,
      status
    } = req.body;


    
    if (id_usuario) {

      const [usuario] = await conexao.query(
        'SELECT id_usuario FROM usuarios WHERE id_usuario = ?',
        [id_usuario]
      );

      if (usuario.length === 0) {
        return res.status(400).json({
          erro: 'Usuário não encontrado'
        });
      }
    }


    
    if (
      id_usuario &&
      data &&
      horarioInicio &&
      horarioFim
    ) {

      const [conflito] = await conexao.query(
        `SELECT id
         FROM agendamentos
         WHERE id_usuario = ?
         AND data = ?
         AND (
           (? < horarioFim AND ? > horarioInicio)
         )`,
        [
          id_usuario,
          data,
          horarioInicio,
          horarioFim
        ]
      );

      if (conflito.length > 0) {
        return res.status(400).json({
          erro: 'Este membro já possui cadastro nesse horário.'
        });
      }
    }


    
    await conexao.query(
      `INSERT INTO agendamentos
      (
        id_usuario,
        data,
        horarioInicio,
        horarioFim,
        status
      )
      VALUES (?, ?, ?, ?, ?)`,
      [
        id_usuario || null,
        data || null,
        horarioInicio || null,
        horarioFim || null,
        status || null
      ]
    );


    res.status(201).json({
      mensagem: 'Registro inserido com sucesso'
    });


  } catch (erro) {

    console.log('ERRO AO CADASTRAR AGENDAMENTO:');
    console.log(erro);

    res.status(500).json({
      erro: 'Erro ao inserir registro'
    });
  }
};



const atualizarAgendamento = async (req, res) => {
  try {

    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        erro: 'ID inválido'
      });
    }

    const {
      id_usuario,
      data,
      horarioInicio,
      horarioFim,
      status
    } = req.body;


   
    if (id_usuario) {

      const [usuario] = await conexao.query(
        'SELECT id_usuario FROM usuarios WHERE id_usuario = ?',
        [id_usuario]
      );

      if (usuario.length === 0) {
        return res.status(400).json({
          erro: 'Usuário não encontrado'
        });
      }
    }


    const dataFormatada = data
      ? data.split('T')[0]
      : null;


    
    if (
      id_usuario &&
      dataFormatada &&
      horarioInicio &&
      horarioFim
    ) {

      const [conflito] = await conexao.query(
        `SELECT id
         FROM agendamentos
         WHERE id_usuario = ?
         AND data = ?
         AND id <> ?
         AND (
           (? < horarioFim AND ? > horarioInicio)
         )`,
        [
          id_usuario,
          dataFormatada,
          id,
          horarioInicio,
          horarioFim
        ]
      );

      if (conflito.length > 0) {
        return res.status(400).json({
          erro: 'Este membro já possui cadastro nesse horário.'
        });
      }
    }


    await conexao.query(
      `UPDATE agendamentos
       SET
         id_usuario = ?,
         data = ?,
         horarioInicio = ?,
         horarioFim = ?,
         status = ?
       WHERE id = ?`,
      [
        id_usuario || null,
        dataFormatada,
        horarioInicio || null,
        horarioFim || null,
        status || null,
        id
      ]
    );


    res.json({
      mensagem: 'Registro atualizado com sucesso'
    });


  } catch (erro) {

    console.log('ERRO AO ATUALIZAR AGENDAMENTO:');
    console.log(erro);

    res.status(500).json({
      erro: 'Erro ao atualizar registro'
    });
  }
};



const excluirAgendamento = async (req, res) => {
  try {

    const { id } = req.params;

    await conexao.query(
      'DELETE FROM agendamentos WHERE id = ?',
      [id]
    );

    res.json({
      mensagem: 'Registro excluído com sucesso'
    });

  } catch (erro) {

    console.log('Erro ao excluir agendamento:', erro);

    res.status(500).json({
      erro: 'Erro ao excluir registro'
    });
  }
};


module.exports = {
  listarAgendamentos,
  cadastrarAgendamento,
  atualizarAgendamento,
  excluirAgendamento
};
