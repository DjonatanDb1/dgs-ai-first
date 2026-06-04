# Cenario 1 - Exercicio 1.1 - Entregavel (Desenvolvedor)

## 1) Analise tecnica de viabilidade para RAG

### 1.1 Desafios por tipo de fonte, impacto e estrategia

| Fonte | Desafio tecnico no pipeline | Impacto na qualidade da resposta | Estrategia de tratamento |
|---|---|---|---|
| PDFs com tabelas complexas (15+ colunas) | Extracao linear quebra relacao linha x coluna, especialmente quando ha quebra de pagina | Risco de responder valor de SLA/frete com coluna errada | Parser de tabela (Camelot/Tabula ou equivalente), chunk tabular por blocos de linhas, repetindo cabecalho em cada chunk de tabela |
| PDFs escaneados (OCR necessario) | OCR introduz ruido, troca de caracteres e perda de estrutura semantica | Recuperacao imprecisa (embedding ruim) e citacao de trecho corrompido | OCR com score de confianca por bloco; blocos abaixo do limiar vao para fila de revisao humana; armazenar trecho original + texto OCR + confianca |
| Wiki Confluence (links internos + macros) | Conteudo fragmentado entre paginas e dependente de macro customizada | Resposta incompleta por recuperar so uma pagina sem dependencias | Ingestao preservando grafo de links; enriquecimento com metadados de pagina pai/filha e labels; retrieval com expansao para paginas relacionadas |
| Planilhas com formulas interdependentes | Valor final depende de formula, aba e referencias cruzadas | Risco de explicar regra errada ao ler apenas celula final sem formula/aba de origem | Extracao por "faixas logicas" (cabecalho + linhas + notas), persistir formula e valor calculado, anexar contexto de aba e vigencia |

Observacao de risco real da base NovaTech:
- Ha contradicao entre PROC-042 v1 e PROC-042-v2 (multiplicadores e prazo adicional +2 vs +3 dias), com coexistencia sem hierarquia formal.
- Isso exige metadado de vigencia e regra de priorizacao por data de emissao + data do chamado.

### 1.2 Estimativa de tamanho da base em tokens

Regra pratica informada:
- 0.75 palavras por token  =>  tokens = palavras / 0.75

Premissas de volume:
- PDFs: 800 documentos x 10 paginas/doc = 8.000 paginas
- Wiki: 400 paginas x 1.500 palavras = 600.000 palavras
- Planilhas: 50 arquivos

Estimativa de palavras:
1. PDFs (considerando media de 550 palavras/pagina por conter texto + tabelas):
- 8.000 x 550 = 4.400.000 palavras

2. Wiki:
- 400 x 1.500 = 600.000 palavras

3. Planilhas (estimativa media de 6.000 palavras equivalentes por arquivo apos serializacao de abas, cabecalhos e formulas):
- 50 x 6.000 = 300.000 palavras

Subtotal palavras:
- 4.400.000 + 600.000 + 300.000 = 5.300.000 palavras

Conversao para tokens (base):
- 5.300.000 / 0.75 = 7.066.667 tokens (~7,1M)

Ajustes tecnicos realistas:
- Overhead de chunking, metadados, duplicacao parcial por overlap e normalizacao: +25%
- OCR de parte escaneada da base (ruido e redundancia): +15%

Total estimado:
- 7,1M x 1,25 x 1,15 = 10,2M tokens (ordem de grandeza entre 9M e 11M)

Conclusao:
- Estimativa esta na faixa esperada para o cenario (8M a 15M), com calculo explicito e premissas auditaveis.

### 1.3 Orcamento de contexto (GPT-4o 128K)

Dados:
- Janela total: 128.000 tokens
- System prompt + instrucoes fixas: ~2.000
- Orcamento util teorico: 126.000

Se chunk medio = 500 tokens:
- Limite teorico bruto: 126.000 / 500 = 252 chunks

Mas isso NAO e pratico em producao por competicao de atencao e lost in the middle.

Orcamento pratico por query (exemplo):
- System + politicas: 2.000
- Pergunta usuario + metadados cliente: 300 a 800
- Historico resumido: 500 a 1.500
- Buffer de seguranca (instrucao de citacao, formato, variacao): ~2.000

Faixa recomendada de retrieval:
- 5 a 10 chunks por query (500 tokens/chunk), priorizando 8 como default

Justificativa:
- 8 chunks de 500 tokens = 4.000 tokens de evidencias, suficiente para cobertura multi-fonte curta.
- Evita saturacao de contexto e reduz risco de evidencias importantes ficarem no meio do prompt.
- Para perguntas multi-dominio (SLA + frete + devolucao), usar retrieval em duas etapas (broad -> rerank), nao apenas aumentar K indiscriminadamente.

### 1.4 Estrategia de chunking recomendada (justificada)

Objetivo:
- Maximizar recuperacao correta para perguntas operacionais de atendimento.

Estrategia por tipo de conteudo:
1. Texto normativo/procedural (POL, PROC):
- Chunk por secao semantica (350 a 550 tokens), overlap 10%.
- Nao cortar no meio de lista de regras/excecoes.

2. Tabelas (SLA, multiplicadores, faixas de peso):
- Chunk tabular por grupo de linhas (120 a 220 tokens) com repeticao de cabecalho.
- Proibir corte de tabela no meio de uma linha logica.

3. Conteudo OCR (escaneado):
- Chunks menores (250 a 350 tokens) para reduzir propagacao de ruido.
- Persistir score de OCR no metadado e usar penalizacao no reranker para baixa confianca.

4. Wiki com links:
- Chunk por heading com resumo local de contexto e links de dependencia.
- Em retrieval, expandir 1 salto em links quando score cair abaixo do limiar.

Medidas contra lost in the middle:
- Ordenar contexto por relevancia e autoridade do documento (vigente > legado).
- Manter no topo chunks com regra principal e excecoes criticas.
- Evitar prompts muito longos com chunks de baixa relevancia.

## 2) Iteracao com Claude (historico resumido)

### Rodada 1 - Prompt ao Claude
"Revise minha analise tecnica de viabilidade RAG para NovaTech e aponte estimativas otimistas, riscos nao cobertos e decisoes de chunking fracas."

### Feedback principal do Claude
1. OCR estava otimista sem criterio de qualidade numerico.
2. Nao havia regra explicita para resolver conflito entre PROC-042 v1 e v2 por data de vigencia/chamado.
3. Orcamento de contexto estava correto no teorico, mas sem limite operacional de K para producao.

### Ajustes incorporados (versao final)
1. Inclusao de controle de OCR por score e fila de revisao humana para baixa confianca.
2. Inclusao de metadado de vigencia e priorizacao por data do chamado (nao delegar conflito ao LLM sozinho).
3. Definicao de K pratico entre 5 e 10 chunks, default 8, com reranking.

### Ganho verificavel da iteracao
- Antes: analise correta, mas generica em governanca de dados.
- Depois: criterios operacionais explicitos (limiares, K padrao, estrategia por tipo de fonte), reduzindo risco de resposta inconsistente.

## 3) Conclusao tecnica

O projeto e tecnicamente viavel no horizonte de 3 meses para um MVP de atendimento, desde que:
- ingestao seja tratada como problema de engenharia de dados (nao so LLM),
- contradicoes de documento tenham governanca de vigencia,
- retrieval mantenha K controlado (5-10) com reranking,
- chunking seja especializado por tipo de conteudo.

Sem esses controles, o risco principal nao e falta de modelo, e sim baixa confiabilidade da evidencia recuperada.
