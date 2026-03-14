# Project Ledger MCP Server

Servidor MCP remoto (Model Context Protocol) para Project Ledger.

Este proyecto expone un endpoint MCP por HTTP (`/mcp`) y actua como una capa delgada entre clientes MCP (agentes/chatbots) y la API SaaS de Project Ledger (`/api/mcp`).

## Que es este servidor

- Provee tools MCP listas para consultas financieras de Project Ledger.
- Reenvia autenticacion y contexto de usuario hacia la API backend.
- Mantiene arquitectura stateless por request (sin sesiones MCP persistentes).
- Valida y normaliza inputs de tools con Zod antes de llamar la API.

## Capacidades

- 19 tools MCP agrupadas por dominio: contexto, proyectos, pagos, gastos, ingresos, obligaciones y resumen.
- Transporte MCP por `StreamableHTTPServerTransport`.
- Health check en `GET /health`.
- Manejo de errores consistente en todas las tools (`toolOk` / `toolFail`).

## Stack

- Node.js + TypeScript (ES2022, NodeNext)
- Express
- `@modelcontextprotocol/sdk`
- Zod

## Requisitos

- Node.js 20+ (recomendado)
- npm o yarn
- Acceso a la API de Project Ledger con:
	- `API_BASE_URL`
	- `MCP_SERVICE_TOKEN`

## Variables de entorno

Crear un archivo `.env` en la raiz:

```env
API_BASE_URL=https://tu-api.projectledger.com
MCP_SERVICE_TOKEN=tu_service_token
PORT=3000
```

Notas:

- `API_BASE_URL` es obligatorio.
- `MCP_SERVICE_TOKEN` es obligatorio.
- `PORT` es opcional (default `3000`).

## Instalacion

```bash
npm install
```

## Ejecutar

Desarrollo:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Produccion:

```bash
npm start
```

## Endpoints del servidor

- `GET /health`
	- Responde estado basico del servicio.
- `POST /mcp`
	- Endpoint MCP principal (stateless, one-request/one-server-instance).

### Headers requeridos hacia `/mcp`

- `X-User-Id`: ID real del usuario final en Project Ledger.
- `Authorization`: opcional para el cliente MCP en este gateway (la llamada saliente usa `MCP_SERVICE_TOKEN` fijo del servidor).

## Catalogo de tools MCP

### Contexto

- `get_context`

### Proyectos

- `get_project_portfolio`
- `get_project_deadlines`
- `get_project_activity_split`

### Pagos

- `get_pending_payments`
- `get_received_payments`
- `get_overdue_payments`
- `get_payments_by_method`

### Gastos

- `get_expense_totals`
- `get_expenses_by_category`
- `get_expenses_by_project`
- `get_expense_trends`

### Ingresos

- `get_income_by_period`
- `get_income_by_project`

### Obligaciones

- `get_upcoming_obligations`
- `get_unpaid_obligations`

### Resumen

- `get_financial_health`
- `get_monthly_overview`
- `get_alerts`

## Arquitectura

Flujo por request:

1. Cliente MCP envia `POST /mcp`.
2. El servidor extrae `X-User-Id` y construye `ServerContext`.
3. Se crea una instancia nueva de `McpServer` y `StreamableHTTPServerTransport`.
4. Cada tool usa closures para llamar `/api/mcp/...` con headers:
	 - `Authorization: Bearer <MCP_SERVICE_TOKEN>`
	 - `X-User-Id: <usuario>`
5. Al finalizar la respuesta, se cierran transporte y servidor.

Caracteristicas importantes:

- Sin estado entre requests.
- Sin sesiones MCP persistentes.
- La logica de negocio vive en la API SaaS; este repo actua como proxy MCP.

## Estructura del proyecto

```text
src/
	index.ts            # Express app + /health + /mcp
	server.ts           # createMcpServer + registro de tools
	auth.ts             # extraccion de contexto de auth request
	apiClient.ts        # cliente HTTP hacia /api/mcp
	config.ts           # carga y validacion de env vars
	tools/
		context.ts
		projects.ts
		payments.ts
		expenses.ts
		income.ts
		obligations.ts
		summary.ts
		schema.ts         # coercion/parsing de parametros
```

## Desarrollo

Comandos utiles:

```bash
npm run dev
npm run build
npm start
```

## Documentacion funcional MCP

La referencia de endpoints y contratos de datos se mantiene en:

- [README-MCP.md](README-MCP.md)

Incluye:

- Catalogo completo de endpoints `/api/mcp`
- Query params por endpoint
- Convenciones de paginacion
- Casos de uso para agentes MCP
- Ejemplos de consumo

## MCP Reference

Para entender el modelo general de MCP y clientes compatibles:

- https://modelcontextprotocol.io/docs/getting-started/intro

