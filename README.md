# Sistema de Gerenciamento de Tarefas baseado em Kanban  
##### Ferramenta simples baseada em microserviços para organização de trabalho em projetos pessoais, acadêmicos ou profissionais, desenvolvida para a disciplina de Engenharia de Software.  
---
## Como executar

### Pré-requisitos

- Docker e Docker Compose

### Clone o repositório
```bash
git clone https://github.com/GIOV4NN4EC/kanban-taskboard.git
```

### Subir todo o sistema

```bash
cd kanban-taskboard
docker compose up --build
```

Acesse:

- **Frontend:** http://localhost:3000
---

## Estrutura do repositório
kanban-taskboard/  
├── gateway/-------# API Gateway  
├── services/  
│   ├── auth-service/------# Autenticação e usuários  
│   ├── project-service/------# Projetos e membros  
│   ├── task-service/------# Tarefas e Kanban  
│   └── notification-service/------# Histórico de atividades  
├── frontend/------# React + TypeScript  
└── docker-compose.yml ------# Orquestração dos containers  

## Arquitetura

| Serviço | Porta (interna) | Responsabilidade |
|---------|-----------------|------------------|
| `api-gateway` | 8000 | Roteamento, CORS, validação JWT |
| `auth-service` | 8001 | Cadastro, login, perfil |
| `project-service` | 8002 | Projetos e membros |
| `task-service` | 8003 | Tarefas e Kanban |
| `notification-service` | 8004 | Histórico de atividades |
| `frontend` | 3000 → 80 | Interface web |

## Estrutura das pastas de Microservices
nome-do-serviço/  
├── Dockerfile -------- # Imagem Docker do serviço  
├── requirements.txt -------- # Dependências Python  
├── app/  
│   ├── main.py -------- # Ponto de entrada FastAPI  
│   ├── config/  
│   │   └── settings.py -------- # Variáveis de ambiente  
│   ├── database/  
│   │   ├── base.py -------- # Classe base do SQLAlchemy  
│   │   └── session.py -------- # Conexão e sessão do banco  
│   ├── models/ -------- # Tabelas (entidades)  
│   ├── schemas/ -------- # Validação entrada/saída (Pydantic)  
│   ├── repositories/ -------- # Acesso ao banco  
│   ├── services/ -------- # Regras de negócio  
│   ├── routes/ -------- # Endpoints HTTP  
│   └── utils/ -------- # Utilitários e clientes HTTP  
 ──

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
- Quadro Kanban (to do, doing, done);
- Criar tarefa;
- Editar tarefa;
- Excluir tarefa;
- Mover tarefa;
- Prioridade da tarefa;
- Prazo por tarefa;
- Indicador de tarefa atrasada
#### Filtros
- Busca por texto
- Filtro por status
- Filtro por responsável
- Filtro por prazo
- Filtro “apenas atrasadas”
- Limpar filtros

### Comentários nas tarefas
- Listar comentários de uma tarefa
- Criar comentário
- Editar comentário (somente o autor)
- Excluir comentário (autor ou dono do projeto)
- Menções a membros (@nome) — só é possível mencionar quem faz parte do projeto
- Painel lateral de comentários ao abrir uma tarefa
