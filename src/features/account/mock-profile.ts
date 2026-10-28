import "server-only";

/** Estado de cuenta en memoria para la versión de prueba (fase 2). En fase 3 vive en `profiles`. */
interface MockProfileState {
  onboardedAt: string | null;
}

const globalForMock = globalThis as typeof globalThis & { __clientaMockProfile?: MockProfileState };

export function mockProfileState(): MockProfileState {
  globalForMock.__clientaMockProfile ??= { onboardedAt: new Date().toISOString() };
  return globalForMock.__clientaMockProfile;
}
