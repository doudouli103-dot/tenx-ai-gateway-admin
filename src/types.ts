export type ModelStatus = 'online' | 'offline' | 'unknown' | 'unmanaged';

export interface GatewayModel {
  id: string;
  capability: string;
  provider: string;
  targetModel: string;
  healthUrl?: string | null;
  runtimeConfigured: boolean;
  status: ModelStatus;
}

export interface CommandResult {
  success: boolean;
  message: string;
  exitCode: number;
  output?: string | null;
}

export interface ModelRuntimeOperationResult {
  model: string;
  action: 'start' | 'stop';
  success: boolean;
  statusBefore: ModelStatus;
  statusAfter: ModelStatus;
  expectedStatus: ModelStatus;
  statusVerified: boolean;
  command: CommandResult;
  resourceCheckOutput?: string | null;
}
