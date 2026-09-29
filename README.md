# Sistema de Login com Níveis de Acesso

Projeto completo com:
- Frontend React + Vite
- Backend Node.js + Express
- MySQL
- bcryptjs para senhas
- JWT para autenticação
- Níveis: administrador, diretor, mobilizador e membro

## 1. Banco de dados

Abra o MySQL e execute `backend/database.sql`.

O script cria o banco `sistema_login`, a tabela `usuarios` e um administrador inicial.

Administrador inicial:
- E-mail: admin@admin.com
- Senha: Admin@123

## 2. Backend

No terminal:

```powershell
cd backend
npm install
npm start
```

Backend: http://localhost:3000

## 3. Frontend

Em outro terminal:

```powershell
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173

## Regras

- O cadastro público cria usuários como `membro`.
- O nível de acesso não pode ser escolhido pelo usuário comum.
- Apenas administrador pode alterar o nível de outro usuário.
- As rotas protegidas usam JWT.
- O frontend esconde opções de acordo com o nível, mas a segurança real fica no backend.

## Permissões demonstradas

Administrador:
- Dashboard
- Gerenciar usuários
- Alterar níveis de acesso

Diretor:
- Dashboard
- Área da diretoria

Mobilizador:
- Dashboard
- Área de mobilização

Membro:
- Dashboard
- Área do membro
