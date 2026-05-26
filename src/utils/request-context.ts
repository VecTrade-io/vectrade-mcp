/**
 * Request-scoped context using AsyncLocalStorage.
 * Stores the user's API key extracted from the X-API-Key header.
 */

import { AsyncLocalStorage } from "node:async_hooks";

interface RequestContext {
  apiKey: string;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

export function getRequestApiKey(): string | undefined {
  return requestContext.getStore()?.apiKey;
}
