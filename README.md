# Sistema de Gerenciamento de Tarefas baseado em Kanban
---  
## Stack
### Backend
- **Python 3.12**: Linguagem dos microserviços e gateway;
- **Uvicorn + FastAPI**: Microserviços e gateway
- **PostgreSQL 16**: Banco de produção
- **SQLAlchemy**: ORM
- **JWT**: autenticação no gateway

### Front-end
- **React**: Interface e renderização no navegador
- **Typescript**: Tipagem estática
- **Vite**: Bundler e dev server
- **MUI**: Componentes visuais e ícones da interface

### DevOps
- **Docker**: Imagens dos serviços e do frontend
- **Docker Compose**: Orquestração dos containers
- **Nginx**: Arquivos estáticos do React e proxy api -> gateway

### Arquitetura
- **Microserviços**: Domínio independente para cada serviço
- **Gateway**: Centralização de entrada
- **REST**: Comunicação HTTP
- Um banco de dados por serviço.

---  
## Funcionalidades
### Autenticação
- Cadastro de usuário (nome, e-mail, senha);
- Login (e-mail e senha);
- Redefinição de senha;
- Logout;

### Perfil do Usuário
- Visualizar perfil (nome, e-mail, descrição, foto);
- Editar perfil (nome, foto, descrição);
- Alterar senha (senha atual + nova senha);
- Excluir conta.

### Projetos
- Criar projeto (nome, descrição opcional, prazo opcional)
- Listar projetos do usuário (projetos em que é membro)
- Buscar projetos por nome ou descrição
- Ver resumo no card — contagem de tarefas concluídas/total e prazo do projeto
- Abrir quadro Kanban do projeto
- Editar projeto (dono)
- Excluir projeto (dono)

### Membros do Projeto
- Listar membros do projeto;
- Adicionar membro por e-mail (dono);
- Remover membro (dono);
- Controle de acesso: só membros podem ver e editar tarefas do projeto.

### Tarefas

  
