import type { GatewayModel, ModelRuntimeOperationResult } from './types';

export interface GatewayClientOptions {
  baseUrl: string;
  apiKey: string;
}

export async function fetchModels(options: GatewayClientOptions): Promise<GatewayModel[]> {
  const response = await request(options, '/admin/models', { method: 'GET' });
  return response.json();
}

export async function startModel(options: GatewayClientOptions, model: string): Promise<ModelRuntimeOperationResult> {
  const response = await request(options, `/admin/models/${encodeURIComponent(model)}/start`, { method: 'POST' });
  return response.json();
}

export async function stopModel(options: GatewayClientOptions, model: string): Promise<ModelRuntimeOperationResult> {
  const response = await request(options, `/admin/models/${encodeURIComponent(model)}/stop`, { method: 'POST' });
  return response.json();
}

async function request(options: GatewayClientOptions, path: string, init: RequestInit): Promise<Response> {
  const baseUrl = options.baseUrl.replace(/\/$/, '');
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }
  return response;
}
