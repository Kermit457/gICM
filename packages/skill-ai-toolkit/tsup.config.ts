import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    rag: 'src/rag.ts',
    embeddings: 'src/embeddings.ts',
    streaming: 'src/streaming.ts',
    agents: 'src/agents.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  external: ['@anthropic-ai/sdk', 'ai'],
});
