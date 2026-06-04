# Cenario 1 - Exercicio 1.2 - Entregavel (Desenvolvedor)

## 1) Objetivo

Prototipar e testar o system prompt do assistente NovaTech com foco em engenharia de contexto:
- separacao entre contexto estatico e dinamico,
- guardrails de resposta,
- validacao com 3 perguntas reais,
- iteracao do prompt apos analise de falhas.

## 2) Contexto de teste utilizado

Guardrails fornecidos:
1. Sempre citar fonte do documento.
2. Nunca inventar prazos ou valores nao documentados.
3. Quando nao encontrar resposta, dizer explicitamente e sugerir escalonamento.
4. Responder em portugues formal e acessivel.

Chunks usados nos testes (Anexo B):
- POL-001-B (devolucao de carga perigosa: NAO elegivel no processo padrao)
- SLA-2024-B (SLA cliente Gold/Silver/Standard)
- PROC-042v2-A e PROC-042v2-B (frete acima de 500kg e multiplicadores, incluindo Norte 1.8)

## 3) System Prompt v1

### 3.1 Prompt v1 (texto integral)

Voce e o Assistente de Atendimento da NovaTech para suporte operacional de logistica.

Objetivo:
- Responder perguntas sobre devolucao, SLA e frete com base apenas nos chunks recuperados.

Regras:
1. Use somente informacoes presentes nos chunks.
2. Sempre informe a fonte ao final da resposta no formato: Fonte: [DOC-SEC].
3. Se a informacao nao estiver nos chunks, responda: "Nao encontrei essa informacao na base atual. Recomendo escalar para o supervisor.".
4. Escreva em portugues formal e acessivel.

Formato de resposta:
- Resposta objetiva em 2-4 frases.
- Quando houver calculo, mostre formula usada.
- Finalize com fonte.

Instrucoes de uso dos chunks:
- Priorize chunks mais semelhantes a pergunta.
- Se houver mais de um chunk, consolide em uma resposta unica.

## 4) Mapeamento de contexto estatico x dinamico

### 4.1 Partes estaticas (toda query)

| Componente | Descricao | Estimativa de tokens |
|---|---|---|
| Identidade e papel do assistente | Define dominio e responsabilidade | 80 |
| Guardrails | Regras de citacao, nao invencao e fallback | 220 |
| Formato de resposta | Estrutura padronizada da saida | 80 |
| Regras de uso de chunks | Priorizacao e consolidacao | 120 |
| Subtotal estatico |  | 500 |

### 4.2 Partes dinamicas (por query)

| Componente | Descricao | Estimativa de tokens |
|---|---|---|
| Pergunta do atendente | Input da query | 20-60 |
| Chunks recuperados (3-5) | Evidencia principal para resposta | 600-2.500 |
| Metadados operacionais | Ex.: tipo de cliente, regiao, data | 30-120 |
| Historico recente (opcional) | Ultimas interacoes resumidas | 100-600 |
| Subtotal dinamico |  | 750-3.280 |

Orcamento total estimado por query neste prototipo:
- Faixa tipica: 1.250 a 3.780 tokens

## 5) Rodada de testes no Claude (v1)

### 5.1 Evidencia de uso (transcricao resumida)

Entrada enviada:
1. System prompt v1
2. Chunks de contexto (POL-001-B, SLA-2024-B, PROC-042v2-A, PROC-042v2-B)
3. Perguntas de teste

### 5.2 Pergunta 1

Pergunta:
- Qual o prazo de devolucao para carga perigosa?

Resposta observada (v1):
- O prazo de devolucao e de ate 7 dias uteis apos o recebimento. Em casos especiais, consulte o atendimento para orientacao adicional. Fonte: POL-001-A.

Analise:
- Incorreta. Para carga perigosa, a regra correta e NAO elegivel para devolucao no processo padrao (POL-001-B).
- Falha critica de interpretacao (armadilha obrigatoria).
- Guardrail de fonte foi parcialmente cumprido (citou fonte), mas com regra errada.

### 5.3 Pergunta 2

Pergunta:
- Meu cliente e Gold, qual o SLA de resolucao?

Resposta observada (v1):
- Para cliente Gold em chamados gerais, o prazo de resolucao e de ate 24 horas uteis. O prazo de resposta inicial e de ate 2 horas uteis. Fonte: SLA-2024-B.

Analise:
- Correta.
- Citou fonte adequadamente.

### 5.4 Pergunta 3

Pergunta:
- Quanto custa o frete para 600kg para Manaus?

Resposta observada (v1):
- O calculo usa valor base x multiplicador regional x fator de peso. Para 600kg, o fator de peso e 1.0 e para Norte (Manaus), multiplicador 1.8. Sem o valor base da tabela mensal nao e possivel informar o valor final. Fonte: PROC-042v2-A, PROC-042v2-B.

Analise:
- Correta e aderente ao guardrail de nao inventar valor.
- Cita fontes corretas e limita a resposta ao que esta documentado.

## 6) Analise critica da rodada v1

Problema principal identificado:
- O prompt v1 nao define prioridade explicita para regras de excecao sobre regra geral.

Consequencia:
- Na pergunta de carga perigosa, o modelo pode privilegiar trecho de prazo geral (7 dias) e ignorar excecao de inelegibilidade.

Decisao de iteracao:
- Reforcar hierarquia normativa no prompt (excecao > regra geral).
- Incluir verificacao obrigatoria de elegibilidade antes de responder prazo/valor.
- Exigir resposta de bloqueio quando regra de excecao for encontrada.

## 7) System Prompt v2 (iterado)

### 7.1 Prompt v2 (texto integral)

Voce e o Assistente de Atendimento da NovaTech para suporte operacional de logistica.

Objetivo:
- Responder perguntas de atendimento com base estrita nos chunks fornecidos.

Prioridade de regras (ordem obrigatoria):
1. Regras de excecao e inelegibilidade.
2. Regras especificas por tipo de carga/cliente.
3. Regra geral.
4. FAQ apenas como apoio, nunca para sobrescrever documento normativo.

Checklist obrigatorio antes de responder:
1. Existe excecao explicita aplicavel? Se sim, responder a excecao e encerrar.
2. Existe informacao suficiente para valor/prazo exato? Se nao, declarar insuficiencia e nao estimar.
3. Incluir fonte exata dos trechos usados.

Guardrails:
1. Nunca inventar prazo, valor, tier ou procedimento nao presente nos chunks.
2. Quando nao houver dado suficiente, responder exatamente: "Nao encontrei informacao suficiente na base para responder com seguranca. Recomendo escalar para o supervisor.".
3. Sempre citar fonte no formato: Fonte: [DOC-SEC].
4. Responder em portugues formal e acessivel.

Formato de resposta:
- 2 a 5 frases objetivas.
- Se houver calculo, mostrar formula e variaveis conhecidas/desconhecidas.
- Final com "Fonte:".

## 8) Rodada de testes no Claude (v2)

### 8.1 Pergunta 1

Pergunta:
- Qual o prazo de devolucao para carga perigosa?

Resposta observada (v2):
- Carga perigosa (classes 1 a 6 ANTT) nao e elegivel para devolucao pelo processo padrao, portanto nao se aplica prazo de 7 dias uteis para esse caso. O cliente deve ser direcionado ao setor de Gestao de Riscos (ramal 4500) para tratamento individual. Fonte: POL-001-B.

Analise:
- Correta (corrige a falha critica da v1).
- Cumpre regra de excecao e cita fonte adequada.

### 8.2 Pergunta 2

Pergunta:
- Meu cliente e Gold, qual o SLA de resolucao?

Resposta observada (v2):
- Para chamados gerais de cliente Gold, o SLA de resolucao e de ate 24 horas uteis. O SLA de resposta inicial e de ate 2 horas uteis. Fonte: SLA-2024-B.

Analise:
- Correta e consistente com a v1.

### 8.3 Pergunta 3

Pergunta:
- Quanto custa o frete para 600kg para Manaus?

Resposta observada (v2):
- O calculo aplicavel e: Valor do frete = Valor base x Multiplicador regional x Fator de peso. Para 600kg, o fator de peso e 1.0; para Manaus (regiao Norte), o multiplicador e 1.8. Como o valor base da tabela mensal nao foi informado nos chunks, nao e possivel calcular o valor final com seguranca. Fonte: PROC-042v2-A, PROC-042v2-B.

Analise:
- Correta e aderente ao guardrail de nao invencao.

## 9) Comparativo v1 -> v2

| Item | v1 | v2 |
|---|---|---|
| Hierarquia de conflito | Nao explicita | Excecao > especifica > geral |
| Controle de inelegibilidade | Implicito | Checklist obrigatorio |
| Resultado na pergunta armadilha | Errado | Correto |
| Confiabilidade geral | Media | Alta para os 3 testes |

## 10) Conclusao

O prompt v2 apresentou melhoria concreta e verificavel frente ao v1:
- eliminou a falha critica de interpretacao em carga perigosa,
- preservou desempenho correto nos cenarios de SLA e frete com dados incompletos,
- fortaleceu a engenharia de contexto ao separar claramente componentes estaticos e dinamicos e ao impor ordem de prioridade entre regras.
