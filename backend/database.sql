CREATE DATABASE IF NOT EXISTS sistema_login
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE sistema_login;

CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    nivel_acesso ENUM(
        'administrador',
        'diretor',
        'mobilizador',
        'membro'
    ) NOT NULL DEFAULT 'membro',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- E-mail: admin@admin.com
-- Senha: Admin@123
-- Hash bcrypt correspondente usado para o administrador inicial.
INSERT INTO usuarios (nome, email, senha, nivel_acesso)
SELECT 'Administrador', 'admin@admin.com',
'$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
'administrador'
WHERE NOT EXISTS (
    SELECT 1 FROM usuarios WHERE email = 'admin@admin.com'
);


CREATE TABLE agendamentos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    data DATE NOT NULL,
    horarioInicio TIME NOT NULL,
    horarioFim TIME NOT NULL,
    status VARCHAR(30) NOT NULL,

    FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS membros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    dataNascimento DATE NOT NULL,
    diretoria VARCHAR(100) NOT NULL,
    cargo VARCHAR(100),
    status VARCHAR(30) DEFAULT 'Ativo',
    cpf VARCHAR(14) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    cep VARCHAR(9),
    endereco VARCHAR(200),
    numeroCasa VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    deadline DATE NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Pendente',
    responsavel_id INT NULL,
    prioridade VARCHAR(20) NOT NULL DEFAULT 'Média',
    progresso INT NOT NULL DEFAULT 0,

    CONSTRAINT fk_tasks_responsavel
        FOREIGN KEY (responsavel_id)
        REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT chk_tasks_progresso
        CHECK (progresso >= 0 AND progresso <= 100)
);



INSERT INTO tasks
(title, description, deadline, status, responsavel_id, prioridade, progresso)
SELECT
    'Organizar reunião de mobilização',
    'Definir participantes, pauta e horário da reunião.',
    DATE_ADD(CURDATE(), INTERVAL 7 DAY),
    'Pendente',
    u.id_usuario,
    'Alta',
    0
FROM usuarios u
WHERE u.email = 'admin@admin.com'
  AND NOT EXISTS (
      SELECT 1 FROM tasks WHERE title = 'Organizar reunião de mobilização'
  );


CREATE TABLE IF NOT EXISTS recuperacao_senha (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expira_em DATETIME NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- ============================================================
-- PROJETOS E CATEGORIAS DE PROJETOS (RF_B2, RF_F4 e RF_F5)
-- Não utiliza a tabela membros.
-- ============================================================

CREATE TABLE IF NOT EXISTS categorias_projeto (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao VARCHAR(255),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projetos (
    id_projeto INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    descricao TEXT,
    objetivo TEXT,
    documentos_necessarios TEXT,
    data_inicio DATE,
    data_fim DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'Planejamento',
    id_categoria INT NOT NULL,
    responsavel_id INT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_projetos_categoria
        FOREIGN KEY (id_categoria)
        REFERENCES categorias_projeto(id_categoria)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_projetos_responsavel
        FOREIGN KEY (responsavel_id)
        REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS projeto_tarefas (
    id_projeto INT NOT NULL,
    id_tarefa INT NOT NULL,
    PRIMARY KEY (id_projeto, id_tarefa),

    CONSTRAINT fk_projeto_tarefas_projeto
        FOREIGN KEY (id_projeto)
        REFERENCES projetos(id_projeto)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_projeto_tarefas_tarefa
        FOREIGN KEY (id_tarefa)
        REFERENCES tasks(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

INSERT INTO categorias_projeto (nome, descricao)
SELECT 'Mobilização', 'Projetos relacionados às ações de mobilização.'
WHERE NOT EXISTS (
    SELECT 1 FROM categorias_projeto WHERE nome = 'Mobilização'
);

INSERT INTO categorias_projeto (nome, descricao)
SELECT 'Educação', 'Projetos relacionados à educação e formação.'
WHERE NOT EXISTS (
    SELECT 1 FROM categorias_projeto WHERE nome = 'Educação'
);

INSERT INTO categorias_projeto (nome, descricao)
SELECT 'Comunicação', 'Projetos relacionados à comunicação e divulgação.'
WHERE NOT EXISTS (
    SELECT 1 FROM categorias_projeto WHERE nome = 'Comunicação'
);
