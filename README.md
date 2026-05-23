# StudyMind Frontend

Frontend oficial do **StudyMind**, uma plataforma de estudos inteligente com integração de IA para geração de planos de estudo, conteúdos personalizados e acompanhamento de desempenho.

O projeto foi desenvolvido com foco em experiência do usuário, organização visual e integração completa com uma API backend em Spring Boot.

---

# Preview

## Tela de Login

* Autenticação segura com JWT
* Interface moderna e responsiva
* Fluxo de login e cadastro integrado ao backend

## Dashboard Inteligente

* Métricas de desempenho
* Taxa de acerto
* Progresso semanal
* Tópicos prioritários
* Roadmap de estudos

---

# Funcionalidades

## Autenticação

* Login e cadastro de usuários
* Persistência de sessão com JWT
* Controle de autenticação no frontend
* Logout seguro

## Dashboard

* Exibição de métricas em tempo real
* Progresso semanal
* Quantidade de questões respondidas
* Taxa de acerto
* Tópicos estudados

## Roadmap Inteligente

* Roadmap gerado por IA
* Organização por semanas
* Navegação dinâmica entre tópicos

## Geração de Conteúdo com IA

Integração com a API da Anthropic para:

* geração de aulas
* geração de questões
* personalização por matéria
* personalização por tópico
* adaptação de dificuldade

## Sistema de Tarefas

* Listagem de tarefas
* Controle de progresso
* Marcação de conclusão

---

# Tecnologias Utilizadas

* HTML5
* CSS3
* JavaScript
* JWT Authentication
* REST API
* Anthropic API (Claude)

---

# Arquitetura do Projeto

```txt
Frontend → Spring Boot API → PostgreSQL
                     ↓
               Anthropic API
```

---

# Integração com Backend

O frontend consome uma API REST desenvolvida em Spring Boot.

Principais integrações:

* autenticação JWT
* dashboard de desempenho
* roadmap de estudos
* geração de aulas
* geração de questões
* gerenciamento de tarefas

---

# Estrutura do Projeto

```txt
src/
 ├── assets/
 ├── css/
 ├── js/
 ├── pages/
 └── components/
```

---

# Responsividade

O projeto foi desenvolvido com foco em responsividade e experiência do usuário.

Compatível com:

* Desktop
* Tablets
* Dispositivos móveis

---

# Objetivos do Projeto

O StudyMind foi criado com o objetivo de:

* unir tecnologia e educação
* aplicar IA em um cenário real
* praticar desenvolvimento fullstack
* explorar arquitetura de sistemas
* evoluir habilidades em frontend e backend

---

# Principais Aprendizados

Durante o desenvolvimento do frontend, foram trabalhados conceitos como:

* integração frontend/backend
* autenticação JWT
* consumo de APIs REST
* manipulação dinâmica do DOM
* gerenciamento de estado visual
* tratamento de erros
* alinhamento de contratos entre frontend e backend
* debugging de aplicações fullstack

---

# Próximas Melhorias

* melhorias de acessibilidade
* dark/light mode
* gráficos mais avançados
* otimizações de performance
* melhorias de UX
* responsividade avançada
* integração em tempo real

---

# Como Executar o Projeto

## 1. Clone o repositório

```bash
git clone https://github.com/eduardo-Ciudad/studymind-frontend.git
```

## 2. Acesse a pasta do projeto

```bash
cd studymind-frontend
```

## 3. Execute o projeto

Basta abrir o arquivo `index.html` ou utilizar uma extensão como Live Server.

---

# Backend do Projeto

O backend do StudyMind foi desenvolvido utilizando:

* Java
* Spring Boot
* PostgreSQL
* Flyway
* JWT
* JPA/Hibernate

---

# Autor

Desenvolvido por Eduardo Ciudad Figueredo.

---

# Licença

Este projeto está sob a licença MIT.
