/**
 * Mock for pino-caller to bypass issues with 'asJsonSym'.
 * This mock returns the passed pino instance, effectively
 * disabling pino-caller's functionality (adding call site info)
 * but allowing the application to run.
 */
export default function pinoCallerMock(pinoInstance) {
  // You can uncomment the line below for debugging to see if the mock is being used.
  // console.log('[pino-caller-mock] Activated. Returning original pino instance:', pinoInstance);
  return pinoInstance;
} 