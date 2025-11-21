// Augment the NodeJS namespace to type process.env variables
// This avoids redeclaring 'process' which causes conflicts with @types/node if present
declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
    API_URL: string;
    [key: string]: string | undefined;
  }
}
