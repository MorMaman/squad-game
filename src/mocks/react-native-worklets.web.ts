/**
 * Web mock for react-native-worklets
 * This package doesn't support web, so we provide empty stubs
 */

// Serializable
export function createSerializable<T>(value: T): T {
  return value;
}

export function isSerializableRef(): boolean {
  return false;
}

export const serializableMappingCache = new Map();

// Deprecated/shareables
export function isShareableRef(): boolean {
  return false;
}

export function makeShareable<T>(value: T): T {
  return value;
}

export function makeShareableCloneOnUIRecursive<T>(value: T): T {
  return value;
}

export function makeShareableCloneRecursive<T>(value: T): T {
  return value;
}

export const shareableMappingCache = new Map();

// Feature flags
export function getStaticFeatureFlag(): boolean {
  return false;
}

export function setDynamicFeatureFlag(): void {}

// Synchronizable
export function isSynchronizable(): boolean {
  return false;
}

export function createSynchronizable<T>(value: T): T {
  return value;
}

// Runtime
export const RuntimeKind = {
  UI: 'UI',
  JS: 'JS',
} as const;

export function getRuntimeKind(): string {
  return 'JS';
}

export function createWorkletRuntime(): object {
  return {};
}

export function runOnRuntime<T>(_runtime: unknown, fn: () => T): T {
  return fn();
}

// Threads
export function callMicrotasks(): void {}

export function executeOnUIRuntimeSync<T>(fn: () => T): T {
  return fn();
}

export function runOnJS<T extends (...args: any[]) => any>(fn: T): T {
  return fn;
}

export function runOnUI<T extends (...args: any[]) => any>(fn: T): T {
  return fn;
}

export function runOnUIAsync<T>(fn: () => T): Promise<T> {
  return Promise.resolve(fn());
}

export function runOnUISync<T>(fn: () => T): T {
  return fn();
}

export function scheduleOnRN(fn: () => void): void {
  fn();
}

export function scheduleOnUI(fn: () => void): void {
  fn();
}

export function unstable_eventLoopTask(): void {}

// Worklet function
export function isWorkletFunction(): boolean {
  return false;
}

// Worklets Module
export const WorkletsModule = {
  makeShareableClone: <T>(value: T): T => value,
};

// Legacy exports
export const Worklets = {
  defaultContext: null,
  createContext: () => ({}),
  createRunInContextFn: () => () => {},
  createRunOnJS: () => () => {},
};

export function useWorklet() {
  return () => {};
}

export function createWorkletContext() {
  return {};
}

export default Worklets;
