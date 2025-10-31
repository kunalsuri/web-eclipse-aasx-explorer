// client/src/features/auth/index.ts

// Export auth hooks
export { useJWTAuth, JWTAuthProvider } from './hooks/use-jwt-auth';

// Note: jwt-auth-utils are not exported to allow dynamic imports for better code splitting