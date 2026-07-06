# Cenario 3 - Exercicio 3.2 - Entregavel Desenvolvedor

## Escopo executado

Exercicio concluido com revisao critica do codigo gerado por IA e reescrita do modulo de feedback no repositorio.

Arquivos implementados:

- [pratica-cenario-2/novatec-assistant/src/functions/feedback/handler.ts](pratica-cenario-2/novatec-assistant/src/functions/feedback/handler.ts)
- [pratica-cenario-2/novatec-assistant/src/functions/feedback/validator.ts](pratica-cenario-2/novatec-assistant/src/functions/feedback/validator.ts)

## 1) Minha analise propria antes do Claude

Codigo simulado revisado (antes de qualquer apoio):

1. Uso de as any no body
- Classificacao: violacao do AGENTS + bug potencial
- Motivo: bypass de tipagem e ausencia de validacao deterministica

2. Uso de console.log
- Classificacao: violacao do AGENTS
- Motivo: projeto exige logging estruturado com pino

3. Uso de require dinamico para CosmosClient
- Classificacao: violacao do AGENTS
- Motivo: padrao exige imports estaticos no topo

4. Logging de attendantEmail em claro
- Classificacao: problema de seguranca
- Motivo: exposicao de dado pessoal em log

5. Ausencia de validacao de entrada
- Classificacao: bug potencial
- Motivo: campos obrigatorios nao validados, risco de persistir payload invalido

6. Ausencia de tratamento para JSON invalido
- Classificacao: bug potencial
- Motivo: request.json pode falhar e derrubar o handler

## 2) Segunda revisao com Claude

Pontos confirmados pelo Claude:

- as any sem validacao Zod
- console.log em vez de pino
- require dinamico
- log de dado pessoal (attendantEmail)
- necessidade de validar request e erros de parse

Ponto adicional reforcado na revisao do Claude:

- separar persistencia da camada HTTP para facilitar testes e reduzir acoplamento

## 3) Comparacao humano vs Claude

Convergencias:

- Concordancia total nos 4 problemas obrigatorios da rubrica
- Concordancia na necessidade de validacao Zod e sanitizacao de logs

Diferencas:

- Minha analise trouxe imediatamente o risco de parse JSON sem tratamento
- Claude enfatizou mais o desacoplamento da persistencia como melhoria de design

Conclusao da comparacao:

- A revisao humana identificou os riscos criticos cedo
- O Claude agregou refinamento arquitetural
- As duas analises foram complementares e nao redundantes

## 4) Codigo reescrito (seguindo AGENTS)

Mudancas aplicadas:

- Zod para validacao de input em [validator.ts](pratica-cenario-2/novatec-assistant/src/functions/feedback/validator.ts)
- Tipos explicitos para input e registro
- pino como logger estruturado
- sem console.log
- sem require dinamico
- import estatico no topo
- sem logar e-mail em claro (mascaramento com redactEmail)
- tratamento de erro para JSON invalido
- retorno HTTP consistente para 405 e 400

## 5) Evidencia de execucao tecnica

Compilacao realizada apos reescrita:

- Comando: npm run build
- Resultado: tsc concluido sem erros