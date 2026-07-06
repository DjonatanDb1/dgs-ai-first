# Cenario 3 - Exercicio 3.1 - Entregavel Desenvolvedor

## Escopo executado

Exercicio concluido com implementacao de structured output validado por Zod e dois guardrails determinísticos no modulo de harness em:

- [pratica-cenario-2/novatec-assistant/src/services/response-validator.ts](pratica-cenario-2/novatec-assistant/src/services/response-validator.ts)

## 1) Schema de structured output

Schema implementado com Zod e campos obrigatorios:

- answer: string obrigatoria, sem vazio
- source_document: string obrigatoria, sem vazio
- confidence_score: number obrigatorio entre 0 e 1

Caracteristicas importantes do schema:

- Estrito: bloqueia campos extras nao previstos
- Validacao deterministica antes de qualquer uso do conteudo
- Fallback seguro quando schema falha

## 2) Guardrails determinísticos implementados

### Guardrail 1 - source_document obrigatorio

Regra: toda resposta deve conter source_document valido.

Comportamento implementado:

- Se source_document nao existir, estiver vazio ou so com espacos, a resposta e bloqueada
- O sistema registra o motivo em log estruturado
- O retorno e substituido por resposta segura padrao

### Guardrail 2 - carga perigosa + devolucao exige negativa

Regra: se a resposta mencionar carga perigosa junto com devolucao, ela deve conter negativa explicita.

Comportamento implementado:

- Detecta termos de carga perigosa e devolucao na resposta
- Verifica se existe negativa explicita (exemplo: nao pode, proibido, inelegivel, impossivel)
- Se a combinacao estiver presente sem negativa, bloqueia a resposta
- Registra motivo em log e retorna resposta segura padrao

## 3) Comportamento de falha segura

Quando qualquer validacao falha:

- accepted = false
- reason recebe motivo deterministico
- response retorna fallback seguro padronizado

Fallback atual:

- answer: mensagem de seguranca orientando revisao humana
- source_document: N/A
- confidence_score: 0

## 4) Code review rapido com Claude e correcoes

Problemas reais identificados e corrigidos:

1. Problema: bloqueio de source_document estava implicito no erro de schema, sem classificacao dedicada
- Risco: perda de observabilidade da regra de negocio mais critica
- Correcao aplicada: funcao dedicada para detectar source_document ausente/vazio e retornar reason especifico missing_source_document

2. Problema: validador nao tratava output em formato JSON string
- Risco: respostas validas do modelo em string JSON poderiam falhar no parse e cair como schema invalido
- Correcao aplicada: parseRawResponse com tentativa de JSON.parse antes da validacao Zod

3. Problema: verificacao de source_document apos parse estava redundante
- Risco: duplicidade de regra e ambiguidade de fluxo
- Correcao aplicada: consolidacao do guardrail no pre-check dedicado e simplificacao do fluxo principal

## 5) Prompt probabilistico vs codigo deterministico

Distincao aplicada no exercicio:

- Prompt e probabilistico: orienta o modelo a citar fonte e negar devolucao de carga perigosa
- Codigo e deterministico: valida schema e bloqueia qualquer resposta fora das regras

Conclusao tecnica:

- Prompt melhora comportamento medio
- Structured output + guardrails em codigo garantem enforcement real em tempo de execucao

## 6) Evidencia de execucao tecnica

Compilacao realizada com sucesso apos implementacao e apos code review:

- Comando executado: npm run build
- Resultado: tsc concluido sem erros