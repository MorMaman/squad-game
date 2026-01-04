/**
 * Web mock for react-native-worklets
 * This package doesn't support web, so we provide empty stubs
 */

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
