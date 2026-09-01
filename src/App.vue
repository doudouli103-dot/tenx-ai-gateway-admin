<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Play, RefreshCcw, Search, Server, Square, Terminal } from '@lucide/vue';
import { fetchModels, startModel, stopModel } from './api';
import type { GatewayModel, ModelRuntimeOperationResult, ModelStatus } from './types';

const storedBaseUrl = localStorage.getItem('tenx.gateway.baseUrl') || 'http://macstudio.tentest.cn:8088';
const storedApiKey = localStorage.getItem('tenx.gateway.apiKey') || 'local-dev-key';

const baseUrl = ref(storedBaseUrl);
const apiKey = ref(storedApiKey);
const models = ref<GatewayModel[]>([]);
const loading = ref(false);
const busyModel = ref('');
const error = ref('');
const notice = ref('');
const lastOperation = ref<ModelRuntimeOperationResult | null>(null);
const capability = ref('all');
const keyword = ref('');

const capabilities = computed(() => {
  const values = new Set(models.value.map((model) => model.capability));
  return ['all', ...Array.from(values)];
});

const filteredModels = computed(() => {
  const query = keyword.value.trim().toLowerCase();
  return models.value.filter((model) => {
    const matchesCapability = capability.value === 'all' || model.capability === capability.value;
    const matchesQuery =
      !query ||
      model.id.toLowerCase().includes(query) ||
      model.provider.toLowerCase().includes(query) ||
      model.targetModel.toLowerCase().includes(query);
    return matchesCapability && matchesQuery;
  });
});

const totals = computed(() => ({
  all: models.value.length,
  online: models.value.filter((model) => model.status === 'online').length,
  offline: models.value.filter((model) => model.status === 'offline').length,
  unmanaged: models.value.filter((model) => model.status === 'unmanaged').length,
}));

onMounted(() => {
  refresh();
});

async function refresh() {
  loading.value = true;
  error.value = '';
  notice.value = '';
  lastOperation.value = null;
  persistSettings();
  try {
    models.value = await fetchModels({ baseUrl: baseUrl.value, apiKey: apiKey.value });
  } catch (currentError) {
    error.value = currentError instanceof Error ? currentError.message : 'Failed to load models';
  } finally {
    loading.value = false;
  }
}

async function runCommand(model: GatewayModel, action: 'start' | 'stop') {
  busyModel.value = `${model.id}:${action}`;
  error.value = '';
  notice.value = '';
  lastOperation.value = null;
  persistSettings();
  try {
    const result =
      action === 'start'
        ? await startModel({ baseUrl: baseUrl.value, apiKey: apiKey.value }, model.id)
        : await stopModel({ baseUrl: baseUrl.value, apiKey: apiKey.value }, model.id);
    notice.value = commandMessage(model.id, action, result);
    lastOperation.value = result;
    await refresh();
  } catch (currentError) {
    error.value = currentError instanceof Error ? currentError.message : `Failed to ${action} ${model.id}`;
  } finally {
    busyModel.value = '';
  }
}

function persistSettings() {
  localStorage.setItem('tenx.gateway.baseUrl', baseUrl.value);
  localStorage.setItem('tenx.gateway.apiKey', apiKey.value);
}

function commandMessage(model: string, action: 'start' | 'stop', result: ModelRuntimeOperationResult) {
  const verb = action === 'start' ? 'Start' : 'Stop';
  return `${verb} ${model}: ${result.success ? 'verified' : 'not verified'} (${result.statusBefore} -> ${result.statusAfter})`;
}

function statusClass(status: ModelStatus) {
  return `status status-${status}`;
}
</script>

<template>
  <main class="shell">
    <header class="topbar">
      <div>
        <div class="eyebrow"><Server :size="15" /> Gateway Control</div>
        <h1>Tenx AI Gateway Admin</h1>
      </div>
      <button class="icon-button" type="button" :disabled="loading" title="Refresh models" @click="refresh">
        <RefreshCcw :size="18" />
      </button>
    </header>

    <section class="settings">
      <label>
        <span>Gateway URL</span>
        <input v-model="baseUrl" type="url" autocomplete="off" />
      </label>
      <label>
        <span>API Key</span>
        <input v-model="apiKey" type="password" autocomplete="off" />
      </label>
      <button class="primary" type="button" :disabled="loading" @click="refresh">
        <RefreshCcw :size="17" />
        Refresh
      </button>
    </section>

    <section class="summary">
      <div>
        <span>Total</span>
        <strong>{{ totals.all }}</strong>
      </div>
      <div>
        <span>Online</span>
        <strong>{{ totals.online }}</strong>
      </div>
      <div>
        <span>Offline</span>
        <strong>{{ totals.offline }}</strong>
      </div>
      <div>
        <span>Unmanaged</span>
        <strong>{{ totals.unmanaged }}</strong>
      </div>
    </section>

    <section class="toolbar">
      <div class="tabs" role="tablist">
        <button
          v-for="item in capabilities"
          :key="item"
          type="button"
          :class="{ active: capability === item }"
          @click="capability = item"
        >
          {{ item }}
        </button>
      </div>
      <label class="search">
        <Search :size="17" />
        <input v-model="keyword" type="search" placeholder="Search model or provider" />
      </label>
    </section>

    <p v-if="error" class="message error">{{ error }}</p>
    <p v-if="notice" class="message notice">{{ notice }}</p>

    <section v-if="lastOperation" class="operation">
      <div class="operation-head">
        <strong>{{ lastOperation.model }}</strong>
        <span :class="lastOperation.success ? 'result-ok' : 'result-fail'">
          {{ lastOperation.success ? 'Success' : 'Needs Check' }}
        </span>
      </div>
      <div class="operation-grid">
        <div>
          <span>Action</span>
          <strong>{{ lastOperation.action }}</strong>
        </div>
        <div>
          <span>Status</span>
          <strong>{{ lastOperation.statusBefore }} -> {{ lastOperation.statusAfter }}</strong>
        </div>
        <div>
          <span>Expected</span>
          <strong>{{ lastOperation.expectedStatus }}</strong>
        </div>
        <div>
          <span>Exit Code</span>
          <strong>{{ lastOperation.command?.exitCode ?? '-' }}</strong>
        </div>
      </div>
      <pre v-if="lastOperation.command?.output">{{ lastOperation.command.output }}</pre>
      <pre v-if="lastOperation.resourceCheckOutput">Resource check:
{{ lastOperation.resourceCheckOutput }}</pre>
    </section>

    <section class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Model</th>
            <th>Capability</th>
            <th>Status</th>
            <th>Provider</th>
            <th>Target</th>
            <th>Health</th>
            <th class="actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="7" class="empty">Loading models...</td>
          </tr>
          <tr v-else-if="filteredModels.length === 0">
            <td colspan="7" class="empty">No models matched.</td>
          </tr>
          <tr v-for="model in filteredModels" v-else :key="model.id">
            <td class="model-name">{{ model.id }}</td>
            <td>{{ model.capability }}</td>
            <td>
              <span :class="statusClass(model.status)">{{ model.status }}</span>
            </td>
            <td>{{ model.provider }}</td>
            <td>{{ model.targetModel }}</td>
            <td class="health">{{ model.healthUrl || '-' }}</td>
            <td class="actions">
              <button
                class="small"
                type="button"
                :disabled="!model.runtimeConfigured || busyModel !== ''"
                title="Start model runtime"
                @click="runCommand(model, 'start')"
              >
                <Play :size="15" />
                Start
              </button>
              <button
                class="small danger"
                type="button"
                :disabled="!model.runtimeConfigured || busyModel !== ''"
                title="Stop model runtime"
                @click="runCommand(model, 'stop')"
              >
                <Square :size="14" />
                Stop
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <footer>
      <Terminal :size="15" />
      <span>Commands run only from gateway runtime configuration.</span>
    </footer>
  </main>
</template>
