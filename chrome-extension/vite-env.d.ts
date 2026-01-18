// This file allows TypeScript to understand Vite's ?inline CSS imports
// Place this in your project root or src/
declare module '*.css?inline' {
  const content: string;
  export default content;
}
