// Type declarations for SCSS side-effect imports (e.g. import './globals.scss')
declare module '*.scss' {
  const content: Record<string, string>;
  export default content;
}
