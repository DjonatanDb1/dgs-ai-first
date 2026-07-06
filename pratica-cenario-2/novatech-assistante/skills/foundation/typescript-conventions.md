# SKILL — TypeScript Conventions (Foundation)

> **Quando usar:** Toda vez que escrever código TypeScript no projeto, antes de qualquer codificação.
> **Criado por:** Tech Lead
> **Consumido por:** Todos (Devs, Tech Lead com Copilot; QA, PS com Claude)
> **Frequência:** Sempre (skill Foundation)

---

## Contexto

Este projeto adota TypeScript com `strict: true` em `tsconfig.json`. A skill define as convenções globais que todo código TypeScript (backend, bot, funções Azure) deve respeitar. Sem um padrão claro, agentes de IA geram código com `any`, `console.log` ao invés de logger estruturado, imports dinâmicos e outros anti-padrões que comprometem manutenibilidade e debugging.

---

## Regras Prescritivas

1. **Strict Mode Obrigatório**
   - Compile TypeScript com `strict: true`.
   - Nunca use `as any`, `// @ts-ignore`, ou `any` sem justificativa comentada.
   - Toda função deve ter tipos de entrada e saída explícitos.

2. **Imports e Exports**
   - Use `import type { X }` para tipos; `import { X }` para valores.
   - Nunca `import *`; sempre nomeie as importações.
   - Nunca `require()` dinâmico; use `import`.

3. **Logging**
   - Use `pino` para logging estruturado.
   - Proibido `console.log`, `console.warn`, `console.error` em código de produção.
   - Log com contexto: `logger.info({ field: value }, "message")`.

4. **Nomeação**
   - Funções/variáveis: `camelCase`.
   - Classes/tipos: `PascalCase`.
   - Constantes: `UPPER_SNAKE_CASE`.

5. **Tratamento de Erros**
   - Defina custom errors herdando de `Error`.
   - Nunca deixe promises sem `.catch()` ou `try/catch` em `async`.
   - Sempre valide entrada com Zod ou similar antes de usar.

---

## Exemplos: DO ✓

### DO: Tipo explícito + validação Zod + logger estruturado

```typescript
import type { HttpRequest, HttpResponseInit } from "@azure/functions";
import pino from "pino";
import { z } from "zod";

const logger = pino({ name: "query-endpoint" });

const querySchema = z.object({
  question: z.string().min(1)
});

type QueryRequest = z.infer<typeof querySchema>;

export async function queryHandler(
  request: HttpRequest
): Promise<HttpResponseInit> {
  try {
    const payload = await request.json();
    const query = querySchema.parse(payload);
    
    logger.info({ questionLength: query.question.length }, "Query accepted");
    
    return { status: 202, jsonBody: { success: true } };
  } catch (error) {
    logger.error({ error }, "Failed to parse query");
    return { status: 400, jsonBody: { error: "Invalid request" } };
  }
}
```

### DO: Custom error com contexto

```typescript
class RetryExhaustedError extends Error {
  constructor(public readonly attempts: number, public readonly lastError: Error) {
    super(`Retry exhausted after ${attempts} attempts`);
    this.name = "RetryExhaustedError";
  }
}

export function assertNever(x: never): never {
  throw new Error(`Unhandled case: ${x}`);
}
```

### DO: Type-safe config

```typescript
const configSchema = z.object({
  AZURE_SEARCH_ENDPOINT: z.string().url(),
  AZURE_OPENAI_KEY: z.string().min(1)
});

type Config = z.infer<typeof configSchema>;

export const config: Config = configSchema.parse(process.env);
```

---

## Exemplos: DON'T ✗

### DON'T: `any` e `as any`

```typescript
// ✗ ANTI-PADRÃO
function processChunk(data: any) {
  const chunk = data as any;
  return chunk.content;
}

// ✓ CORRETO
type Chunk = { content: string; source: string };
function processChunk(data: Chunk): string {
  return data.content;
}
```

### DON'T: `console.log` em produção

```typescript
// ✗ ANTI-PADRÃO
export async function queryHandler(request: HttpRequest) {
  const payload = await request.json();
  console.log("Received:", payload); // Logging desajeitado
  console.warn("Processing query"); // Sem estrutura
}

// ✓ CORRETO
export async function queryHandler(request: HttpRequest) {
  const payload = await request.json();
  logger.info({ payload }, "Received query request");
}
```

### DON'T: Promise sem tratamento de erro

```typescript
// ✗ ANTI-PADRÃO
export async function fetchChunks(query: string) {
  const result = await azureSearch.search(query); // Não há try/catch
  return result.chunks;
}

// ✓ CORRETO
export async function fetchChunks(query: string) {
  try {
    const result = await azureSearch.search(query);
    return result.chunks;
  } catch (error) {
    logger.error({ error }, "Search failed");
    throw new SearchError(`Failed to fetch chunks for: ${query}`);
  }
}
```

### DON'T: Imports dinâmicos

```typescript
// ✗ ANTI-PADRÃO
const logger = require("./logger"); // CommonJS dinâmico

// ✓ CORRETO
import { createLogger } from "./logger";
const logger = createLogger();
```

### DON'T: `import *`

```typescript
// ✗ ANTI-PADRÃO
import * as utils from "./utils";
const result = utils.processChunk(data);

// ✓ CORRETO
import { processChunk } from "./utils";
const result = processChunk(data);
```

---

## Anti-padrões Úteis (para Copilot)

Agentes de IA geram estas construções erroneamente; a skill deve evitá-las:

1. **`as unknown as Type` (type casting sem validação)**
   - Risco: bypassa validação de tipos.
   - Mitigação: usar Zod ou type guards explícitos.

2. **Função genérica sem constraints** (`function process<T>(x: T)`)
   - Risco: perde informação de tipo.
   - Mitigação: constrair `T` ou usar tipos concretos.

3. **Async sem `await`**
   - Risco: fire-and-forget que quebra em testes.
   - Mitigação: sempre `await` ou `.catch()` promises.

4. **Logger global sem inicialização**
   - Risco: logger vazio no topo do arquivo sem contexto.
   - Mitigação: inicializar `pino` com nome do módulo.

5. **Tipos implícitos em parâmetros de função**
   - Risco: `function handler(req)` sem tipo.
   - Mitigação: anotar `req: HttpRequest`.

---

## Dependências

Nenhuma (Foundation é base).

## Próximas Skills

- [domain/azure-functions-endpoint.md](../domain/azure-functions-endpoint.md)
- [domain/error-handling-patterns.md](../domain/error-handling-patterns.md)
- [artifact/create-rag-endpoint.md](../artifact/create-rag-endpoint.md)
