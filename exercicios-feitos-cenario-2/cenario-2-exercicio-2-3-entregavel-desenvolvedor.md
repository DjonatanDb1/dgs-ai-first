# Cenario 2 - Exercicio 2.3 - Entregavel Desenvolvedor

## 1) Arvore de Skills do Projeto

Estrutura hierárquica Foundation → Domain → Artifact, implementada em `/skills/`:

```
skills/
├── foundation/
│   ├── typescript-conventions.md
│   ├── error-handling.md
│   └── project-structure.md
├── domain/
│   ├── azure-functions-endpoint.md
│   ├── azure-ai-search-integration.md
│   ├── react-components.md
│   └── testing-patterns.md
└── artifact/
    ├── create-rag-endpoint.md
    ├── create-integration-test.md
    └── create-react-card.md
```

## 2) Mapeamento de Criacao e Consumo por Papel

| Skill | Nivel | Criado por | Consumido por | Frequencia | Frase-ativacao |
|---|---|---|---|---|---|
| typescript-conventions | Foundation | Tech Lead | Dev + Copilot, QA + Claude, PS + Claude | Sempre | "Como devo estruturar código TypeScript?" |
| error-handling | Foundation | Tech Lead | Dev + Copilot | Sempre | "Como lidar com erros em Azure Functions?" |
| project-structure | Foundation | Tech Lead | Dev + Copilot | Sempre | "Qual a estrutura de pastas esperada?" |
| azure-functions-endpoint | Domain | Tech Lead | Dev + Copilot | A cada endpoint | "Como criar um endpoint Azure Functions?" |
| azure-ai-search-integration | Domain | Dev Sênior | Dev Pleno + Copilot | A cada retrieval | "Como integrar Azure AI Search?" |
| react-components | Domain | Dev Sênior | Dev Pleno + Copilot | A cada componente web | "Como estruturar componente React?" |
| testing-patterns | Domain | QA | Dev + Copilot, QA + Claude | A cada teste | "Como escrever um teste Vitest?" |
| create-rag-endpoint | Artifact | Dev Sênior | Dev Pleno + Copilot | Varias vezes (5 endpoints) | "Gere um endpoint RAG para [módulo]" |
| create-integration-test | Artifact | QA | Dev + Copilot, QA + Claude | Varias vezes (fixtures) | "Crie teste de integração para [cenário]" |
| create-react-card | Artifact | Dev Sênior | Dev Pleno + Copilot | Varias vezes (10+ cards) | "Crie componente de card para [tipo]" |

### Justificativa de criacao/consumo multi-papel

Foundation skills (typescript-conventions, error-handling, project-structure):
- Criadas pelo Tech Lead (decisões arquiteturais duráveis).
- Consumidas por DEV (via Copilot), QA (via Claude para entender padrões de teste), PS (via Claude para entender estrutura de artefatos).

Domain skills (azure-functions-endpoint, testing-patterns):
- Criadas por papéis especialistas (Tech Lead para endpoint, QA para testes).
- Consumidas por DEV com Copilot (implementação) e QA/PS com Claude (validação/planejamento).

Artifact skills (create-rag-endpoint, create-integration-test):
- Criadas por DEV Sênior/QA (receitas prontas).
- Consumidas por DEV Pleno via Copilot (geração de código) e QA via Claude (validação).

## 3) SKILL.md Foundation — typescript-conventions

Implementado em: [pratica-cenario-2/novatech-assistant/skills/foundation/typescript-conventions.md](pratica-cenario-2/novatech-assistant/skills/foundation/typescript-conventions.md)

Contém:
- **Contexto:** Por que TypeScript strict e qual o risco de não seguir.
- **5 Regras Prescritivas:**
  1. Strict mode obrigatório.
  2. Imports com `import type` para tipos.
  3. Logger com pino, proibido console.log.
  4. Nomeação camelCase/PascalCase.
  5. Tratamento de erros com custom errors.

- **4 Exemplos DO (padrão correto):**
  - Tipo explícito + validação Zod + logger estruturado (handler completo).
  - Custom error com contexto.
  - Type-safe config com Zod.

- **5 Exemplos DON'T (anti-padrão):**
  - `any` e `as any`.
  - `console.log` em produção.
  - Promise sem tratamento de erro.
  - Imports dinâmicos (require).
  - `import *`.

- **5 Anti-padrões Úteis:**
  1. `as unknown as Type` (type casting).
  2. Função genérica sem constraints.
  3. Async sem `await`.
  4. Logger global sem inicialização.
  5. Tipos implícitos em parâmetros.

Cada anti-padrão inclui risco explícito e mitigação.