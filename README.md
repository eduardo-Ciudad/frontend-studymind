# StudyMind Frontend

Frontend oficial do **StudyMind**, uma plataforma de estudos inteligente com integração de IA para geração de planos de estudo, conteúdos personalizados e acompanhamento de desempenho.

O projeto foi desenvolvido com foco em experiência do usuário, organização visual e integração completa com uma API backend em Spring Boot.

---

## Preview

### Tela de Login

![StudyMind — Tela de Login](src/assets/screenshots/login.png)

> Interface de autenticação com layout split-screen: apresentação do produto à esquerda e formulário de login/cadastro à direita.

---

## Funcionalidades

### Autenticação

- Login e cadastro de usuários
- Persistência de sessão com JWT
- Controle de autenticação no frontend
- Logout seguro

### Dashboard

- Exibição de métricas em tempo real
- Progresso semanal
- Quantidade de questões respondidas
- Taxa de acerto
- Tópicos estudados

### Roadmap Inteligente

- Roadmap gerado por IA
- Organização por semanas
- Navegação dinâmica entre tópicos

### Geração de Conteúdo com IA

Integração com a API da Anthropic para:

- Geração de aulas
- Geração de questões
- Personalização por matéria e tópico
- Adaptação de dificuldade

### Sistema de Tarefas

- Listagem de tarefas
- Controle de progresso
- Marcação de conclusão

---

## Tecnologias Utilizadas

- HTML5
- CSS3
- JavaScript
- JWT Authentication
- REST API
- Anthropic API (Claude)

---

## Arquitetura do Projeto

```txt
Frontend → Spring Boot API → PostgreSQL
                   ↓
             Anthropic API
```

---

## Integração com Backend

O frontend consome uma API REST desenvolvida em Spring Boot.

Principais integrações:

- Autenticação JWT
- Dashboard de desempenho
- Roadmap de estudos
- Geração de aulas
- Geração de questões
- Gerenciamento de tarefas

---

## Estrutura do Projeto

```txt
src/
 ├── assets/
 │    └── screenshots/
 ├── css/
 ├── js/
 ├── pages/
 └── components/
```

---

## Responsividade

Compatível com:

- Desktop
- Tablets
- Dispositivos móveis

---

## Como Executar o Projeto

### 1. Clone o repositório

```bash
git clone https://github.com/eduardo-Ciudad/studymind-frontend.git
```

### 2. Acesse a pasta do projeto

```bash
cd studymind-frontend
```

### 3. Execute o projeto

Abra o arquivo `index.html` diretamente no navegador ou utilize a extensão **Live Server** no VS Code.

---

## Backend do Projeto

O backend do StudyMind foi desenvolvido com:

- Java 17
- Spring Boot 3
- PostgreSQL
- Flyway
- JWT
- JPA / Hibernate

Repositório: [studymind-backend](https://github.com/educiudad/studymind-backend)

---

## Objetivos do Projeto

O StudyMind foi criado com o objetivo de:

- Unir tecnologia e educação
- Aplicar IA em um cenário real
- Praticar desenvolvimento fullstack
- Explorar arquitetura de sistemas
- Evoluir habilidades em frontend e backend

---

## Principais Aprendizados

- Integração frontend/backend
- Autenticação JWT
- Consumo de APIs REST
- Manipulação dinâmica do DOM
- Gerenciamento de estado visual
- Tratamento de erros
- Alinhamento de contratos entre frontend e backend
- Debugging de aplicações fullstack

---

## Próximas Melhorias

- Melhorias de acessibilidade
- Dark/light mode
- Gráficos mais avançados
- Otimizações de performance
- Melhorias de UX
- Responsividade avançada
- Integração em tempo real

---

## Autor

Desenvolvido por **Eduardo Ciudad Figueredo**

---

## Licença

Este projeto está sob a licença [MIT](LICENSE).