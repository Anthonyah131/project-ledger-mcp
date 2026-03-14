# MCP API - Guia de Endpoints para Tools

Referencia tecnica del modulo MCP de Project Ledger: como consumir los endpoints, que parametros aceptan y que esperar en las respuestas.

Disenado para consumo desde un servidor MCP donde un agente de IA invoca tools que llaman estos endpoints en `/api/mcp`.

---

## Changelog de mejoras (v2)

Las siguientes mejoras fueron aplicadas para hacer los endpoints mas flexibles y tolerantes al consumo desde agentes de IA:

| Area | Mejora |
|---|---|
| Validadores enum | Eliminados validadores regex estrictos en `granularity`, `status`, `direction`. Ahora la API normaliza el valor recibido en lugar de rechazarlo con 400. |
| `granularity` | Acepta `day/daily`, `week/weekly`, `month/monthly`. Cualquier otro valor se trata como `month`. |
| `direction` | Acepta `expense/expenses/out/outgoing`, `income/incomes/in/incoming`, y cualquier otro valor como `both`. |
| `status` (portfolio, obligations) | El matching es case-insensitive; `Active`, `ACTIVE` y `active` son equivalentes. |
| `expenses/totals` | Nuevo: `categoryId` y `categoryName` para filtrar totales por categoria especifica. |
| `expenses/by-project` | Nuevo: `projectId` y `projectName` para filtrar la vista comparativa a proyectos especificos. |
| `income/by-project` | Nuevo: `projectId` y `projectName` para filtrar la vista comparativa a proyectos especificos. |
| `projects/deadlines` | Nuevo: `search` para filtrar deadlines por titulo o descripcion de obligacion. |
| `projects/portfolio` | Eliminado: parametro `dueInDays` (era dead code sin efecto sobre el calculo). |
| `payments/pending` | Nuevo campo en respuesta: `daysUntilDue` (entero positivo, `null` si ya vencio). |
| `payments/received` | Nuevo: soporte de filtro `isActive` y campo `isActive` en cada item de respuesta. |

---

## 1. Proposito

La API MCP expone consultas optimizadas para asistentes y tools analiticas sobre:

- Contexto de usuario y permisos.
- Portafolio y salud de proyectos.
- Pagos, ingresos, egresos y obligaciones.
- Resumenes ejecutivos y alertas financieras.

## 1.1 Contexto de uso: agente IA + chatbot

Patron esperado:

1. El usuario hace una pregunta en lenguaje natural al chatbot.
2. El agente de IA decide que tool MCP invocar.
3. La tool MCP llama al endpoint HTTP correspondiente en `/api/mcp`.
4. El agente transforma la respuesta en lenguaje natural, manteniendo trazabilidad de datos.

Implicaciones de diseno:

- Las respuestas son deterministicas y faciles de resumir por un LLM.
- El agente puede enviar valores de enum en cualquier capitalizacion o variante comun (ver seccion 3.7).
- Los campos `status`, `code`, `priority` y metricas numericas deben tratarse como fuente de verdad.
- Todos los endpoints pueden llamarse sin parametros opcionales y retornan datos utiles.

---

## 2. Base URL y Autenticacion

- Base path: `/api/mcp`
- Todos los endpoints son `GET`.
- Requieren service token Bearer valido del servidor MCP.
- Requieren policy `Plan:CanUseApi`.

Headers:

- `Authorization` (required): `Bearer <mcp_service_token>`
- `X-User-Id` (required): `<userId>`
- `Accept` (optional): `application/json`

Notas importantes:

- El service token se valida contra la variable de entorno `MCP_SERVICE_TOKEN`.
- `X-User-Id` debe contener el `userId` real del usuario en la base de datos.
- La API construye internamente un principal autenticado equivalente al JWT para reutilizar filters, policies y acceso multi-tenant sin bifurcar controladores/servicios.
- Si se envia `projectId`, la API valida acceso del usuario al proyecto.

---

## 3. Convenciones Comunes

## 3.1 Paginacion (endpoints paginados)

Cuando un endpoint hereda `PagedRequest`, acepta:

- `page` (optional, default `1`, minimo `1`)
- `pageSize` (optional, default `20`, rango `1..100`)
- `sortBy` (optional, depende del endpoint)
- `sortDirection` (optional, `asc` o `desc`, default `desc`)

Formato de respuesta paginada:

```json
{
  "items": [],
  "page": 1,
  "pageSize": 20,
  "totalCount": 0,
  "totalPages": 0,
  "hasPreviousPage": false,
  "hasNextPage": false,
  "searchNote": "No projects matched projectName 'proyecto x'. Returned empty results."
}
```

## 3.2 Fechas y rangos

- `DateOnly` usa formato `YYYY-MM-DD`.
- Campos `month` usan `YYYY-MM`.
- Si `from > to` (o equivalentes como `dueAfter > dueBefore`), retorna `400`.

Defaults de rango (si no envias fechas en tendencias):

- Granularidad `day`: ultimos 30 dias.
- Granularidad `week`: ultimas 12 semanas aprox.
- Granularidad `month`: ultimos 12 meses.

## 3.3 Moneda y montos

- Los totales agregados usan montos convertidos (`ConvertedAmount`) cuando aplica.
- Se incluyen tambien monedas originales en endpoints de detalle (ej. ingresos recibidos).

## 3.4 Estados relevantes

Proyectos (`status`) - case-insensitive:

- `active`
- `completed`
- `at_risk`
- `inactive`

Obligaciones (`status`) - case-insensitive:

- `open`
- `partially_paid`
- `overdue`
- `paid`

## 3.5 Errores

Respuesta de error estandar:

```json
{
  "status": 400,
  "message": "Invalid date range: 'from' cannot be greater than 'to'.",
  "detail": null
}
```

Errores por plan/limites:

```json
{
  "statusCode": 403,
  "message": "Plan limit exceeded.",
  "errorCode": "PLAN_LIMIT_EXCEEDED",
  "feature": "CanUseApi"
}
```

## 3.6 Natural Language Search

Para soportar prompts en lenguaje natural del agente:

- Todos los endpoints que aceptan `projectId` tambien aceptan `projectName` como alternativa fuzzy.
- El matching por nombre es case-insensitive y priorizado: `equals` -> `startsWith` -> `contains`.
- Si hay multiples matches en el nivel de prioridad seleccionado, se devuelven todos.
- Si no hay match por nombre, el endpoint devuelve resultados vacios (nunca error) y adjunta `searchNote`.
- La misma prioridad de matching (`equals` -> `startsWith` -> `contains`) aplica en filtros por `categoryName` y `paymentMethodName`.
- Para listados (`payments/received`, `payments/pending`, `payments/overdue`, `obligations/upcoming`, `obligations/unpaid`, `projects/deadlines`) existe `search` para buscar por titulo y descripcion.

## 3.7 Normalizacion de valores enum

La API normaliza automaticamente los valores de `granularity` y `direction` antes de procesarlos. El agente puede enviar variantes coloquiales sin recibir un error 400.

**`granularity`**:

| Valor enviado | Interpretado como |
|---|---|
| `day`, `daily` | `day` |
| `week`, `weekly` | `week` |
| `month`, `monthly`, `null`, vacio, cualquier otro | `month` |

**`direction`** (solo en `payments/by-method`):

| Valor enviado | Interpretado como |
|---|---|
| `expense`, `expenses`, `out`, `outgoing` | `expense` |
| `income`, `incomes`, `in`, `incoming` | `income` |
| `both`, `null`, vacio, cualquier otro | `both` |

**`status`** (en `projects/portfolio`, `obligations/unpaid`):

El filtro es case-insensitive, por lo que `Active`, `ACTIVE` y `active` son equivalentes.

---

## 4. Catalogo de Endpoints

| Endpoint | Descripcion | Tipo de respuesta |
|---|---|---|
| `GET /api/mcp/context` | Contexto de usuario, permisos y proyectos visibles | `McpContextResponse` |
| `GET /api/mcp/projects/portfolio` | Vista de portafolio por proyecto con estado y metricas | `McpPagedResponse<McpProjectPortfolioItemResponse>` |
| `GET /api/mcp/projects/deadlines` | Deadlines de obligaciones por proyecto | `McpPagedResponse<McpProjectDeadlineItemResponse>` |
| `GET /api/mcp/projects/active-vs-completed` | Split de proyectos por estado | `McpProjectActivitySplitResponse` |
| `GET /api/mcp/payments/pending` | Obligaciones con saldo pendiente | `McpPagedResponse<McpPaymentObligationItemResponse>` |
| `GET /api/mcp/payments/received` | Ingresos recibidos | `McpPagedResponse<McpReceivedPaymentItemResponse>` |
| `GET /api/mcp/payments/overdue` | Obligaciones vencidas con deuda | `McpPagedResponse<McpPaymentObligationItemResponse>` |
| `GET /api/mcp/payments/by-method` | Uso de metodos de pago (in/out/net) | `McpPaymentMethodUsageResponse` |
| `GET /api/mcp/expenses/totals` | Totales de gasto con filtro de categoria opcional | `McpExpenseTotalsResponse` |
| `GET /api/mcp/expenses/by-category` | Distribucion de gasto por categoria | `McpExpenseByCategoryResponse` |
| `GET /api/mcp/expenses/by-project` | Distribucion de gasto por proyecto (filtrables) | `McpExpenseByProjectResponse` |
| `GET /api/mcp/expenses/trends` | Tendencia temporal de egresos | `McpExpenseTrendsResponse` |
| `GET /api/mcp/income/by-period` | Tendencia temporal de ingresos | `McpIncomeByPeriodResponse` |
| `GET /api/mcp/income/by-project` | Distribucion de ingresos por proyecto (filtrables) | `McpIncomeByProjectResponse` |
| `GET /api/mcp/obligations/upcoming` | Obligaciones proximas a vencer | `McpPagedResponse<McpObligationItemResponse>` |
| `GET /api/mcp/obligations/unpaid` | Obligaciones impagas/abiertas | `McpPagedResponse<McpObligationItemResponse>` |
| `GET /api/mcp/summary/financial-health` | Score y senales de salud financiera | `McpFinancialHealthResponse` |
| `GET /api/mcp/summary/monthly-overview` | Resumen mensual consolidado | `McpMonthlyOverviewResponse` |
| `GET /api/mcp/summary/alerts` | Alertas financieras con prioridad | `McpAlertsResponse` |

---

## 5. Detalle de Endpoints

## 5.1 Contexto

### GET /api/mcp/context

Sin query params.

Entrega:

- `userId`, `generatedAtUtc`
- `defaultCurrencyCode`
- `permissions` y `limits` (capabilities del plan)
- `visibleProjects[]` con `projectId`, `projectName`, `currencyCode`, `userRole`

Uso tipico: inicializar contexto de tools antes de consultas analiticas.

## 5.2 Proyectos

### GET /api/mcp/projects/portfolio

Query:

- `projectId` (optional)
- `projectName` (optional, alternativa fuzzy a `projectId`)
- `status` (optional, case-insensitive): `active|completed|at_risk|inactive`
- `activityDays` (optional, default `30`)
- Paginacion estandar

`sortBy` soportado: `name`, `status`, `totalSpent`, `totalIncome`, `netBalance`, `progress`  
Fallback: `lastActivityAtUtc`

Cada item incluye:

- Identidad de proyecto y rol
- `lastActivityAtUtc`, `nextDeadline`
- `status` calculado, `progressPercent`
- `totalSpent`, `totalIncome`, `netBalance`
- `budgetUsedPercentage`, `openObligations`, `overdueObligations`

### GET /api/mcp/projects/deadlines

Query:

- `projectId` (optional)
- `projectName` (optional, alternativa fuzzy a `projectId`)
- `dueFrom` (optional)
- `dueTo` (optional)
- `includeOverdue` (optional, default `true`)
- `search` (optional): filtra por titulo o descripcion de la obligacion
- Paginacion estandar

Notas:

- Solo devuelve obligaciones con saldo restante > 0.
- Orden por `dueDate` (`sortDirection`), luego nombre de proyecto.

Cada item incluye: `projectName`, `obligationId`, `title`, `dueDate`, `daysUntilDue`, `remainingAmount`, `currency`, `status`.

### GET /api/mcp/projects/active-vs-completed

Query:

- `projectId` (optional)
- `projectName` (optional, alternativa fuzzy a `projectId`)
- `activityDays` (optional, default `30`)

Respuesta:

- Conteos: `activeCount`, `completedCount`, `atRiskCount`, `inactiveCount`
- `items[]` con `projectId`, `projectName`, `status`

## 5.3 Payments

### GET /api/mcp/payments/pending

Query:

- `projectId` (optional)
- `projectName` (optional, alternativa fuzzy a `projectId`)
- `dueBefore` (optional)
- `dueAfter` (optional)
- `minRemainingAmount` (optional)
- `search` (optional, busqueda parcial por titulo y descripcion)
- Paginacion estandar

Devuelve obligaciones con saldo pendiente (`remainingAmount > 0`).

Respuesta por item (`McpPaymentObligationItemResponse`):

```json
{
  "obligationId": "...",
  "projectId": "...",
  "projectName": "string",
  "title": "string",
  "dueDate": "YYYY-MM-DD",
  "daysUntilDue": 12,
  "daysOverdue": null,
  "totalAmount": 1000.0,
  "paidAmount": 0.0,
  "remainingAmount": 1000.0,
  "currency": "USD",
  "status": "open"
}
```

`daysUntilDue`: entero positivo si la fecha de vencimiento es futura; `null` si ya vencio.  
`daysOverdue`: entero positivo si esta vencida; `null` si aun no vence.

### GET /api/mcp/payments/received

Query:

- `projectId` (optional)
- `projectName` (optional, alternativa fuzzy a `projectId`)
- `from` (optional)
- `to` (optional)
- `paymentMethodId` (optional)
- `paymentMethodName` (optional, alternativa fuzzy)
- `categoryId` (optional)
- `categoryName` (optional, alternativa fuzzy)
- `minAmount` (optional)
- `isActive` (optional): `true` solo ingresos activos, `false` solo recordatorios, omitido incluye ambos
- `search` (optional, busqueda parcial por titulo y descripcion)
- Paginacion estandar

`sortBy` soportado: `title`, `amount`, `project` - fallback: `incomeDate`

Cada item contiene: `incomeDate`, `title`, `originalAmount`, `originalCurrency`, `convertedAmount`, `categoryName`, `paymentMethodName`, `isActive`.

### GET /api/mcp/payments/overdue

Query:

- `projectId` (optional)
- `projectName` (optional, alternativa fuzzy a `projectId`)
- `overdueDaysMin` (optional, default `0`)
- `minRemainingAmount` (optional)
- `search` (optional, busqueda parcial por titulo y descripcion)
- Paginacion estandar

Entrega solo obligaciones vencidas con saldo pendiente. Cada item incluye `daysOverdue`.

### GET /api/mcp/payments/by-method

Query:

- `projectId` (optional)
- `projectName` (optional, alternativa fuzzy a `projectId`)
- `from` (optional)
- `to` (optional)
- `direction` (optional, default `both`) - acepta variantes (ver seccion 3.7)
- `top` (optional, `1..100`, default `10`)

Respuesta:

- `from`, `to`, `direction` (valor normalizado)
- `items[]` con `totalOutgoing`, `totalIncoming`, `netFlow`, conteos y `usagePercentage`

## 5.4 Expenses

### GET /api/mcp/expenses/totals

Query:

- `projectId` (optional)
- `projectName` (optional, alternativa fuzzy a `projectId`)
- `from` (optional)
- `to` (optional)
- `comparePreviousPeriod` (optional, `true/false`)
- `categoryId` (optional): filtra totales a una categoria especifica por ID
- `categoryName` (optional): filtra totales a una categoria especifica por nombre (fuzzy)

Respuesta:

- `totalSpent`, `transactionCount`, `averageExpense`
- `searchNote` (incluye nota si `categoryName` no encontro coincidencias)
- Si `comparePreviousPeriod=true`: `previousPeriodTotal`, `deltaAmount`, `deltaPercentage`
  - El filtro de categoria se aplica tambien al periodo previo para comparacion coherente.

### GET /api/mcp/expenses/by-category

Query:

- `projectId` (optional)
- `projectName` (optional, alternativa fuzzy a `projectId`)
- `from` (optional)
- `to` (optional)
- `top` (optional, `1..100`, default `10`)
- `includeOthers` (optional, agrega bucket `Others` para categorias fuera del top)
- `includeTrend` (optional, calcula `trendDelta` vs periodo previo equivalente)

Respuesta:

- `totalSpent`
- `items[]`: `categoryId`, `categoryName`, `totalAmount`, `expenseCount`, `percentage`, `trendDelta?`

### GET /api/mcp/expenses/by-project

Muestra cuanto gasto cada proyecto en el rango. Acepta filtro de proyecto.

Query:

- `projectId` (optional): acota el breakdown a proyectos especificos
- `projectName` (optional): alternativa fuzzy a `projectId`
- `from` (optional)
- `to` (optional)
- `top` (optional, `1..100`, default `10`)
- `includeBudgetContext` (optional, default `true`)

Respuesta por proyecto:

- `totalSpent`, `expenseCount`
- `budget` y `budgetUsedPercentage` si hay presupuesto activo

### GET /api/mcp/expenses/trends

Query:

- `projectId` (optional)
- `projectName` (optional, alternativa fuzzy a `projectId`)
- `from` (optional)
- `to` (optional)
- `granularity` (optional, default `month`) - acepta variantes (ver seccion 3.7)
- `categoryId` (optional)
- `categoryName` (optional, alternativa fuzzy)

Respuesta:

- `from`, `to` (rango efectivo), `granularity` (valor normalizado)
- `points[]` con `periodStart`, `periodLabel`, `totalSpent`, `expenseCount`

## 5.5 Income

### GET /api/mcp/income/by-period

Query:

- `projectId` (optional)
- `projectName` (optional, alternativa fuzzy a `projectId`)
- `from` (optional)
- `to` (optional)
- `granularity` (optional, default `month`) - acepta variantes (ver seccion 3.7)
- `comparePreviousPeriod` (optional)

Respuesta:

- `totalIncome`, `incomeCount`, `granularity` (normalizado)
- Delta opcional contra periodo previo
- `points[]` con `periodStart`, `periodLabel`, `totalIncome`, `incomeCount`

### GET /api/mcp/income/by-project

Muestra cuanto ingreso cada proyecto. Acepta filtro de proyecto.

Query:

- `projectId` (optional): acota el breakdown a proyectos especificos
- `projectName` (optional): alternativa fuzzy a `projectId`
- `from` (optional)
- `to` (optional)
- `top` (optional, `1..100`, default `10`)

Respuesta:

- `totalIncome`
- `items[]` con `projectId`, `projectName`, `currencyCode`, `totalIncome`, `incomeCount`

## 5.6 Obligations

### GET /api/mcp/obligations/upcoming

Query:

- `projectId` (optional)
- `projectName` (optional, alternativa fuzzy a `projectId`)
- `dueWithinDays` (optional, `1..3650`, default `30`)
- `minRemainingAmount` (optional)
- `search` (optional, busqueda parcial por titulo y descripcion)
- Paginacion estandar

Incluye obligaciones con due date entre hoy y `hoy + dueWithinDays`. Solo las con saldo positivo.

Cada item incluye: `daysUntilDue`, `daysOverdue`, `paidAmount`, `remainingAmount`, `status`.

### GET /api/mcp/obligations/unpaid

Query:

- `projectId` (optional)
- `projectName` (optional, alternativa fuzzy a `projectId`)
- `status` (optional, case-insensitive): `open|partially_paid|overdue`
- `search` (optional, busqueda parcial por titulo y descripcion)
- Paginacion estandar

Incluye obligaciones con saldo restante positivo.

## 5.7 Summary

### GET /api/mcp/summary/financial-health

Query:

- `projectId` (optional)
- `projectName` (optional, alternativa fuzzy a `projectId`)
- `from` (optional)
- `to` (optional)

Respuesta:

- `score` (`0..100`) - combinacion de balance neto, mora, presion de presupuesto e ingresos vs gastos
- `totalIncome`, `totalSpent`, `netBalance`, `burnRatePerDay`
- `budgetRiskProjects`, `overdueObligationsCount`
- `keySignals[]` - frases legibles por humano/LLM con las senales mas relevantes

### GET /api/mcp/summary/monthly-overview

Query:

- `month` (optional, formato `YYYY-MM`, default mes actual)
- `projectId` (optional)
- `projectName` (optional, alternativa fuzzy a `projectId`)

Respuesta:

- KPIs del mes: `totalSpent`, `totalIncome`, `netBalance`, `expenseCount`, `incomeCount`
- `topCategories[]` (top 5 por gasto)
- `paymentMethodSplit[]`
- `projectHealth[]` con `spent`, `income`, `net`, `budgetUsedPercentage` por proyecto
- `alerts[]` generadas automaticamente

### GET /api/mcp/summary/alerts

Query:

- `month` (optional, formato `YYYY-MM`)
- `projectId` (optional)
- `projectName` (optional, alternativa fuzzy a `projectId`)
- `minPriority` (optional, `0..100`, default `0`)

Respuesta:

- `items[]` ordenados por prioridad desc
- Cada item: `code`, `type`, `message`, `priority`, `projectId?`, `obligationId?`
- Codigos tipicos: `BUDGET_OVER_80`, `OVERDUE_OBLIGATIONS`, `NEGATIVE_NET`

---

## 6. Ejemplos de Consumo

## 6.1 Obtener contexto MCP

```bash
curl -X GET "https://<host>/api/mcp/context" \
  -H "Authorization: Bearer <token>" \
  -H "X-User-Id: <userId>"
```

## 6.2 Portafolio paginado - solo proyectos activos

```bash
curl -G "https://<host>/api/mcp/projects/portfolio" \
  -H "Authorization: Bearer <token>" \
  -H "X-User-Id: <userId>" \
  --data-urlencode "status=active" \
  --data-urlencode "sortBy=netBalance" \
  --data-urlencode "sortDirection=desc"
```

## 6.3 Tendencia mensual de egresos (granularity en variante coloquial)

```bash
curl -G "https://<host>/api/mcp/expenses/trends" \
  -H "Authorization: Bearer <token>" \
  -H "X-User-Id: <userId>" \
  --data-urlencode "granularity=monthly" \
  --data-urlencode "from=2025-01-01" \
  --data-urlencode "to=2025-12-31"
```

`monthly` es normalizado automaticamente a `month`.

## 6.4 Totales de gasto filtrados por categoria

```bash
curl -G "https://<host>/api/mcp/expenses/totals" \
  -H "Authorization: Bearer <token>" \
  -H "X-User-Id: <userId>" \
  --data-urlencode "categoryName=viajes" \
  --data-urlencode "from=2025-01-01" \
  --data-urlencode "to=2025-06-30" \
  --data-urlencode "comparePreviousPeriod=true"
```

## 6.5 Pagos pendientes con dias hasta vencimiento

```bash
curl -G "https://<host>/api/mcp/payments/pending" \
  -H "Authorization: Bearer <token>" \
  -H "X-User-Id: <userId>" \
  --data-urlencode "projectName=mi proyecto" \
  --data-urlencode "sortDirection=asc"
```

La respuesta incluye `daysUntilDue` en cada item para que el agente pueda priorizar sin calcular fechas.

## 6.6 Deadlines buscando por texto

```bash
curl -G "https://<host>/api/mcp/projects/deadlines" \
  -H "Authorization: Bearer <token>" \
  -H "X-User-Id: <userId>" \
  --data-urlencode "search=proveedor" \
  --data-urlencode "includeOverdue=true"
```

## 6.7 Secuencia recomendada para tool-calling en chatbot

Flujo minimo recomendado:

1. Invocar `GET /api/mcp/context` al inicio de sesion para obtener `visibleProjects` y `permissions`.
2. Identificar `projectId` objetivo desde `visibleProjects` (o dejar que el endpoint haga el fuzzy match con `projectName`).
3. Ejecutar la consulta agregada principal (`summary/monthly-overview`, `expenses/totals`, `summary/financial-health`).
4. Si el usuario pide detalle, invocar endpoints drill-down (`expenses/by-category`, `payments/received`, `projects/deadlines`).
5. Si hay muchos resultados, paginar y resumir por bloques en lugar de cargar todo en una sola respuesta del LLM.

## 6.8 Minimal call por endpoint (ningun parametro requerido)

Todos los endpoints pueden llamarse sin parametros opcionales:

```bash
# Reemplazar <endpoint> por cualquiera de los listados en el catalogo
curl -G "https://<host>/api/mcp/<endpoint>" \
  -H "Authorization: Bearer <token>" \
  -H "X-User-Id: <userId>"
```

---

## 7. Recomendaciones para Integracion de Tools (Agente IA)

- Llamar primero `GET /api/mcp/context` para conocer permisos y scope.
- Reusar `projectId` en consultas posteriores para reducir ruido.
- Aplicar paginacion siempre en listados para evitar respuestas muy grandes.
- Tratar `status` y `code` como catalogos controlados (no hardcodear solo en UI, tambien en logica de tool).
- Si recibes `403`, revisar permisos de plan/capabilities antes de reintentar.

## 7.1 Buenas practicas especificas para un agente en chatbot

- No adivinar: si falta `projectId` y hay multiples proyectos, pedir aclaracion al usuario o usar un default explicito.
- Reducir tokens: preferir endpoints de resumen antes de endpoints de detalle masivo.
- Mantener contexto temporal explicito: si el usuario no indica fechas, informar el rango default aplicado.
- En respuestas narradas, siempre incluir moneda y periodo para evitar ambiguedad.
- Si `items` llega vacio, responder como resultado valido sin tratarlo como error.
- Con errores `400`, corregir parametros (rango de fechas, enums, formatos) antes de reintentar.

## 7.2 Convencion sugerida de tools MCP

Para mejorar precision del agente, definir tools con nombre y proposito explicito. Ejemplos:

- `mcp_get_context` -> `GET /api/mcp/context`
- `mcp_get_project_portfolio` -> `GET /api/mcp/projects/portfolio`
- `mcp_get_monthly_overview` -> `GET /api/mcp/summary/monthly-overview`
- `mcp_get_alerts` -> `GET /api/mcp/summary/alerts`

Sugerencia de contrato por tool:

- `description`: cuando usarla (intencion del usuario).
- `inputSchema`: solo parametros permitidos por el endpoint.
- `outputMapping`: campos clave que el agente debe priorizar al redactar la respuesta.
- `errorHandling`: reglas de retry/no-retry segun codigo HTTP.

## 7.3 Politica de retry recomendada para tools

- `400`: no reintentar sin corregir parametros.
- `401/403`: no reintentar automaticamente; escalar a renovacion de sesion/permisos.
- `404`: tratar como recurso no encontrado en el scope del usuario.
- `500`: reintento con backoff limitado (por ejemplo 1-2 intentos).

## 8. Parameter Optionality Rules

- Todos los filtros/query params son `(optional)` salvo que explicitamente se marque `(required)`.
- Un filtro omitido se ignora; no se fuerza un valor restrictivo por defecto para filtrar resultados.
- En paginacion, si `page`, `pageSize` o `sortDirection` se omiten, se aplican sus defaults.
- Los unicos headers requeridos para MCP son `Authorization` y `X-User-Id`.

## 9. Estructura del Modulo MCP

Archivos principales del modulo MCP luego del refactor:

- `Controllers/McpController.cs`
- `Services/Interfaces/IMcpService.cs`
- `Services/Mcp/McpContextService.cs`
- `Services/Mcp/McpProjectService.cs`
- `Services/Mcp/McpPaymentService.cs`
- `Services/Mcp/McpExpenseService.cs`
- `Services/Mcp/McpIncomeService.cs`
- `Services/Mcp/McpObligationService.cs`
- `Services/Mcp/McpSummaryService.cs`
- `DTOs/Mcp/McpContextDTOs.cs`
- `DTOs/Mcp/McpProjectDTOs.cs`
- `DTOs/Mcp/McpPaymentDTOs.cs`
- `DTOs/Mcp/McpExpenseDTOs.cs`
- `DTOs/Mcp/McpIncomeDTOs.cs`
- `DTOs/Mcp/McpObligationDTOs.cs`
- `DTOs/Mcp/McpSummaryDTOs.cs`
- `DTOs/Mcp/McpRequestDTOs.cs`

## 10. Fuente de Verdad Tecnica

Contratos y logica de negocio estan definidos en:

- `Controllers/McpController.cs`
- `DTOs/Mcp/`
- `Services/Interfaces/IMcpService.cs`
- `Services/Mcp/`
- `DTOs/Common/PaginationDTOs.cs`
- `Middleware/GlobalExceptionHandlerMiddleware.cs`

---

# MCP Guide: isActive en Gastos e Ingresos

## Objetivo

Documentar como se considera el campo isActive en consultas MCP relacionadas con gastos e ingresos, y como utilizarlo cuando sea necesario.

## Resumen de comportamiento

- isActive=false significa transaccion en modo recordatorio (existe, pero no contabiliza).
- En MCP, los calculos agregados de gastos/ingresos usan solo transacciones activas.
- Los pagos usados para estado de obligaciones tambien excluyen transacciones inactivas.

## Impacto funcional en MCP

### 1) Metricas y agregados

Las siguientes familias MCP trabajan con datos activos (contables):
- Expense totals/by category/by project/trends
- Income by period/by project
- Financial health
- Monthly overview
- Alerts
- Obligation-related summaries

Esto garantiza que las metricas de negocio no se contaminen con recordatorios no ejecutados.

### 2) Received payments (detalle de ingresos)

Se agrego soporte explicito de isActive en MCP:

- Query:
  - McpReceivedPaymentsQuery.IsActive (bool?)
- Response item:
  - McpReceivedPaymentItemResponse.IsActive (bool)

Uso recomendado:
- isActive=true: solo ingresos contables efectivos
- isActive=false: solo recordatorios de ingresos
- sin filtro: ambos (segun alcance y filtros adicionales)

## Ejemplo de uso conceptual

Request (query object):
```json
{
  "projectId": "79d6f0ad-95d2-4f1a-95d8-7c1f95f1b329",
  "from": "2026-03-01",
  "to": "2026-03-31",
  "isActive": true,
  "page": 1,
  "pageSize": 20
}
```

Response item:
```json
{
  "incomeId": "25595cf0-dfbb-422a-8ee4-80bb2d5de2a8",
  "projectId": "79d6f0ad-95d2-4f1a-95d8-7c1f95f1b329",
  "projectName": "Proyecto Alfa",
  "title": "Cobro factura 1021",
  "originalAmount": 120000.00,
  "originalCurrency": "CRC",
  "convertedAmount": 120000.00,
  "isActive": true
}
```

## Recomendaciones para agentes MCP

- Para analisis financiero real, usar siempre datos activos.
- Si el caso de uso requiere forecast o pipeline de cobros/pagos pendientes, consultar/filtrar isActive=false de forma explicita en endpoints de detalle que lo soporten.
- En reportes ejecutivos, aclarar si el conjunto usado fue activo-only o mixto.

## Consideraciones de obligaciones

En obligaciones, el monto pagado y el estado (open/partially_paid/paid/overdue) ignoran pagos inactivos.
Esto evita marcar como pagada una obligacion con transacciones de recordatorio.

## Referencias tecnicas

- Campo en dominio:
  - expenses.exp_is_active
  - incomes.inc_is_active
- Endpoint API para cambio rapido:
  - PATCH /api/projects/{projectId}/expenses/{expenseId}/active-state
  - PATCH /api/projects/{projectId}/incomes/{incomeId}/active-state
