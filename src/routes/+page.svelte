<script lang='ts'>
  import { Button } from '$lib/components/ui/button'
  import { dependencies, devDependencies, packageManager } from '../../package.json'

  let count = $state(0)

  function increment() {
    count += 1
  }

  function getVersion(packageName: string, deps: Record<string, string>) {
    const version = deps[packageName]
    return version ? version.replace('^', '').replace('~', '') : undefined
  }

  function getPackageManager(name: string) {
    return name.split('@')[1]
  }

  const techStack = [
    { name: 'Svelte', version: getVersion('svelte', devDependencies) },
    { name: 'TypeScript', version: getVersion('typescript', devDependencies) },
    { name: 'Vite', version: getVersion('vite', devDependencies) },
    { name: 'Bun', version: getPackageManager(packageManager) },
    { name: 'UnoCSS', version: getVersion('unocss', devDependencies) },
    { name: 'ESLint (antfu)', version: getVersion('@antfu/eslint-config', devDependencies) },
    { name: 'Shadcn UI (via unocss-preset-shadcn)', version: getVersion('unocss-preset-shadcn', devDependencies) },
    { name: 'Iconify', version: getVersion('@iconify-json/solar', devDependencies) },
    { name: 'Fontsource', version: getVersion('@fontsource/berkshire-swash', dependencies) },
  ]
</script>

<div class='min-h-screen flex flex-col items-center gap-15 bg-background p-8'>
  <h1 class='flex items-center gap-2 text-4xl text-primary font-bold'>
    <span class='i-solar:star-bold size-8'></span>
    Svelte Stack
  </h1>

  <div class='flex flex-col items-center gap-4'>
    <p class='text-3xl font-medium'>
      Count: {count}
    </p>
    <Button variant='gradient' class='text-lg' on:click={increment}>
      Increment
    </Button>
  </div>

  <div class='w-fit'>
    <h2 class='mb-4 text-center text-2xl text-primary font-bold'>Tech Stack</h2>
    <ul class='flex flex-col items-start gap-2'>
      {#each techStack as tech (tech.name)}
        <li class='flex items-center gap-2'>
          <span class='i-solar:check-square-bold size-5 text-primary'></span>
          {tech.name}
          {#if tech.version}
            <span class='text-sm text-muted-foreground'>- v{tech.version}</span>
          {/if}
        </li>
      {/each}
    </ul>
  </div>
</div>
