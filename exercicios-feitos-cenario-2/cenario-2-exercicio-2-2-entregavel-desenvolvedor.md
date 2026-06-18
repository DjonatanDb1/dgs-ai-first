# Cenario 2 - Exercicio 2.2 - Entregavel Desenvolvedor

## 1) Conversao do plan em tasks.md (SDD)

Arquivo: [pratica-cenario-2/novatech-assistant/specs/query-endpoint/tasks.md](pratica-cenario-2/novatech-assistant/specs/query-endpoint/tasks.md)

Tasks definidas de forma atomica, com ID, criterios verificaveis, dependencias e estimativa:
- TQ-01: Setup HTTP endpoint + validacao de input (P)
- TQ-02: Cliente de embedding Azure OpenAI com retry/backoff (M)
- TQ-03: Retrieval top-5 no Azure AI Search (M)
- TQ-04: Prompt builder com guardrails de context budget ADR-0002 (M)
- TQ-05: Completion GPT-4o + validacao de output schema (M)
- TQ-06: Tratamento de contradicoes por vigencia ADR-0003 (M)
- TQ-07: Testes de integracao do endpoint (G)

Justificativa de atomicidade:
- Cada task tem fronteira tecnica propria e criterio de aceite testavel isoladamente.
- Dependencias em cadeia evitam acoplamento circular.

## 2) Implementacao da primeira task (TQ-01)

### 2.1 Arquivos alterados
- [pratica-cenario-2/novatech-assistant/src/functions/query/validator.ts](pratica-cenario-2/novatech-assistant/src/functions/query/validator.ts)
- [pratica-cenario-2/novatech-assistant/src/functions/query/handler.ts](pratica-cenario-2/novatech-assistant/src/functions/query/handler.ts)
- [pratica-cenario-2/novatech-assistant/specs/query-endpoint/tasks.md](pratica-cenario-2/novatech-assistant/specs/query-endpoint/tasks.md)

### 2.2 O que foi implementado
- Endpoint HTTP em Azure Functions v4 com assinatura tipada (`HttpRequest`, `InvocationContext`, `HttpResponseInit`).
- Restricao de metodo: apenas POST, com retorno 405 para demais metodos.
- Parsing de JSON com fallback de erro 400 quando payload invalido.
- Validacao de entrada com Zod:
  - `question` obrigatoria
  - `question` sem string vazia
  - limite maximo de tamanho
- Logging estruturado com pino (sem uso de console.log).
- Resposta placeholder com `source_document` no contrato de retorno.

### 2.3 Evidencia de funcionalidade
Build executado com sucesso:
- Comando: `npm run build`
- Resultado: `tsc -p .` concluido sem erros.

## 3) Revisao critica do codigo gerado (pre-code review)

Abaixo estao problemas reais identificados na implementacao atual (propositadamente deixados para tarefas seguintes do plano):

1. Ausencia de validacao de output com Zod
- Impacto: o endpoint ainda nao valida schema de saida para respostas de modelo.
- Risco: regressao de contrato JSON para consumidores do endpoint.
- Ajuste proposto: criar schema de resposta e validar no ponto de retorno (TQ-05).

2. Ainda nao existe retry/backoff para chamadas externas
- Impacto: o fluxo atual nao cobre resiliencia para erros 429/5xx da camada Azure.
- Risco: falha imediata em cenarios transientes.
- Ajuste proposto: implementar utilitario de retry exponencial no servico de embedding/retrieval (TQ-02/TQ-03).

3. Sem enforcement de contradicao por vigencia
- Impacto: nao ha logica de priorizacao da versao mais recente em documentos conflitantes.
- Risco: resposta com dados desatualizados (problema ja mapeado no cenario 1).
- Ajuste proposto: aplicar regra de recencia com metadado de vigencia e sinalizar versao anterior quando necessario (TQ-06).

## 4) Conexao com o cenario 1

A implementacao respeita a transicao de prototipo para producao:
- Cenario 1 validou a abordagem RAG com stack open-source.
- Cenario 2 formaliza o fluxo com SDD, contrato de endpoint e padroes de producao (Azure Functions v4, Zod, pino), preparando a migracao para Azure AI Search + Azure OpenAI.
