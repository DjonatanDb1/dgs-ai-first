# Cenario 2 - Exercicio 2.1 - Entregavel Desenvolvedor

## 1) Mapeamento necessidade -> MCP server local

| Necessidade do projeto | Server local (gratuito) | Tools / Resources / Prompts | Quem consome | Escopo minimo |
|---|---|---|---|---|
| Ler/escrever codigo, specs e skills | filesystem_rw | Tools: leitura/escrita de arquivos. Resources: arvore local permitida. Prompts: n/a | Dev, Tech Lead, Copilot | ./src ./specs ./skills ./prompts ./tests |
| Ler documentacao de negocio | filesystem_docs_ro | Tools: leitura de arquivos (politica de uso somente leitura). Resources: docs Novatech. Prompts: n/a | Dev, Product Specialist, QA, Claude/Copilot | ./docs/novatech |
| Ler corpus de retrieval | filesystem_corpus_ro | Tools: leitura de arquivos (politica de uso somente leitura). Resources: chunks RAG. Prompts: n/a | Dev, QA, Copilot | ./data/retrieval-corpus |
| Historico, branches e diff local | git | Tools: log/diff/branch. Resources: estado do repo. Prompts: n/a | Dev, Tech Lead | repositorio local (.) |
| Memoria persistente de decisoes e linguagem ubiqua | memory | Tools: criar/consultar fatos. Resources: grafo de memoria local. Prompts: n/a | Todos os papeis e agentes | armazenamento local do server |
| Catalogo de primitivas MCP para aprendizado/debug | everything | Tools/Resources/Prompts de referencia do protocolo | Tech Lead, Dev | sem acesso ao dominio |

## 2) Arquivo de configuracao final

Arquivo atualizado em: pratica-cenario-2/novatech-assistant/.mcp/mcp.json

```json
{
  "mcpServers": {
    "filesystem_rw": {
      "command": "npx",
      "args": [
        "-p",
        "@modelcontextprotocol/server-filesystem",
        "-c",
        "mcp-server-filesystem ./src ./specs ./skills ./prompts ./tests"
      ]
    },
    "filesystem_docs_ro": {
      "command": "npx",
      "args": [
        "-p",
        "@modelcontextprotocol/server-filesystem",
        "-c",
        "mcp-server-filesystem ./docs/novatech"
      ],
      "readOnly": true
    },
    "filesystem_corpus_ro": {
      "command": "npx",
      "args": [
        "-p",
        "@modelcontextprotocol/server-filesystem",
        "-c",
        "mcp-server-filesystem ./data/retrieval-corpus"
      ],
      "readOnly": true
    },
    "git": {
      "command": "npx",
      "args": [
        "-p",
        "mcp-server-git",
        "-c",
        "mcp-server-git ."
      ]
    },
    "memory": {
      "command": "npx",
      "args": [
        "-p",
        "@modelcontextprotocol/server-memory",
        "-c",
        "mcp-server-memory"
      ]
    },
    "everything": {
      "command": "npx",
      "args": [
        "-p",
        "@modelcontextprotocol/server-everything",
        "-c",
        "mcp-server-everything"
      ]
    }
  }
}
```

### Justificativa de least privilege
- Separacao de escopos: codigo (rw) separado de fontes de negocio/corpus.
- docs/novatech e data/retrieval-corpus ficam em servers dedicados, para evitar mistura com escopo de escrita do codigo.
- Campo readOnly foi marcado na configuracao para deixar a intencao explicita para revisao humana.
- Enforcement aplicado: ACL de sistema operacional com DENY (W) nas pastas docs/novatech e data/retrieval-corpus para o usuario local do agente.

## 3) Evidencias de execucao (coletadas localmente)

### 3.1 Leitura de documento de negocio (docs/novatech)
Comando executado no repo local mostrou trechos de POL-001:
- POL-001-politica-devolucao.md:24 -> "NÃO sao elegiveis para devolucao pelo processo padrao"
- POL-001-politica-devolucao.md:26 -> "Cargas perigosas classificadas nas classes 1 a 6 da ANTT"

### 3.2 Recuperacao de chunk do corpus (data/retrieval-corpus)
Pergunta de referencia: "Posso devolver carga perigosa?"
- chunks-novatech.md:113 (mapa de cobertura) -> chunks esperados: POL-001-B
- chunks-novatech.md:25-26 -> conteudo do Chunk POL-001-B
- chunks-novatech.md:89-90 -> Chunk FAQ-03 (relevancia secundaria)

Coerencia com Anexo B: pergunta mapeada para POL-001-B e FAQ-03 como menor relevancia.

### 3.3 Historico do repositorio (git)
Comando executado:
- git log --oneline -n 5

Saida coletada:
- bbdd03a (HEAD -> master) chore: starter repo (Anexo D) - estrutura + dados semeados dos Anexos A e B

### 3.4 Tentativa de subida dos servers
- filesystem: "Secure MCP Filesystem Server running on stdio" (escopo ./docs/novatech validado).
- memory: "Knowledge Graph MCP Server running on stdio".
- git (npm): comando `npx -p mcp-server-git -c "mcp-server-git ."` executado com `EXIT:0`.
- read-only efetivo no SO (Windows ACL):
  - `docs/novatech DB1\\djonatan.costa:(DENY)(W)`
  - `data/retrieval-corpus DB1\\djonatan.costa:(DENY)(W)`
  - tentativa de escrita em ambas as pastas retornou `UnauthorizedAccessException`.

## 4) Riscos de seguranca no setup local + mitigacoes

1. Escopo amplo do filesystem pode expor segredos (.env, chaves, tokens).
- Mitigacao: manter apenas pastas necessarias no escopo; nunca incluir raiz do repo; revisar mcp.json em code review.

2. Escrita indevida em docs de negocio/corpus por agentes.
- Mitigacao: separar em servers dedicados e impor ACL read-only no SO para esses diretorios; gate de revisao humana para qualquer alteracao fora de src/specs/skills.

3. Dependencia de binarios locais (uvx/npx) sem baseline de versao.
- Mitigacao: definir preflight script (node/npm/uvx), versoes minimas e healthcheck no onboarding.

4. Agente continuar respondendo sem fonte quando um server cair.
- Mitigacao: politica obrigatoria de degradacao segura: sem docs/corpus, responder "fonte indisponivel" e bloquear resposta conclusiva.