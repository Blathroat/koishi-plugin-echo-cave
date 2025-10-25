import { build } from 'esbuild'
import yamlPlugin from 'esbuild-plugin-yaml'

await build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    outfile: 'lib/index.cjs',
    format: 'cjs',
    platform: 'node',
    external: [
        'koishi',
    ],
    plugins: [yamlPlugin.yamlPlugin({})],
})
