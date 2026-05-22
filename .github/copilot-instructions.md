# VecTrade MCP — Copilot Instructions

## Workflow

All agents follow the standard workflow defined in `instructions/agent-workflow.instructions.md`:
**Implement → Verify → Changelog → Commit**

## Agents

| Agent | When to Use |
|-------|------------|
| `@vt-mcp-dev` | Implementing MCP tools/resources |
| `@vt-mcp-tester` | Writing/fixing tests |

## Conventions

- TypeScript 5.x
- Model Context Protocol (stdio + SSE transport)
- Tool names: `snake_case`, verb_noun pattern
- Format responses for AI readability (not raw JSON)
- Validate inputs before API calls
- Return errors as content, don't throw

## Build & Test

```bash
npm ci                     # Install
npm run build              # Build (tsup)
npm test                   # Run tests (vitest)
npm run typecheck          # tsc --noEmit
```
