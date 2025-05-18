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
    {
      title: 'Core',
      items: [
        { name: 'Svelte', version: getVersion('svelte', devDependencies) },
        { name: 'SvelteKit', version: getVersion('@sveltejs/kit', devDependencies) },
        { name: 'TypeScript', version: getVersion('typescript', devDependencies) },
        { name: 'Vite', version: getVersion('vite', devDependencies) },
        { name: 'Bun', version: getPackageManager(packageManager) },
      ],
    },
    {
      title: 'Styling & UI',
      items: [
        { name: 'UnoCSS', version: getVersion('unocss', devDependencies) },
        { name: 'Shadcn UI (via unocss-preset-shadcn)', version: getVersion('unocss-preset-shadcn', devDependencies) },
        { name: 'Iconify' },
        { name: 'Fontsource', version: getVersion('@fontsource/ubuntu', dependencies) },
      ],
    },
    {
      title: 'Backend & Database',
      items: [
        { name: 'Auth.js', version: getVersion('@auth/sveltekit', dependencies) },
        { name: 'Drizzle ORM', version: getVersion('drizzle-orm', dependencies) },
        { name: 'Turso DB', version: getVersion('@libsql/client', dependencies) },
      ],
    },
    {
      title: 'Other',
      items: [
        { name: 'Vitest', version: getVersion('vitest', devDependencies) },
        { name: 'Playwright', version: getVersion('@playwright/test', devDependencies) },
        { name: 'ESLint (antfu)', version: getVersion('@antfu/eslint-config', devDependencies) },
        { name: 'Cloudflare', version: getVersion('wrangler', devDependencies) },
      ],
    },
  ]
</script>

<div class='flex flex-col items-center gap-8 bg-background pt-8'>
  <div class='flex flex-col items-center gap-4'>
    <p class='text-3xl font-medium'>
      Count: {count}
    </p>
  </div>

  <div class='flex flex-col items-center gap-4'>
    <Button variant='default' class='text-base' onclick={increment}>
      Increment
    </Button>
    <Button variant='secondary' class='text-base' onclick={increment}>
      Increment
    </Button>
    <Button variant='outline' class='text-base' onclick={increment}>
      Increment
    </Button>
    <Button variant='destructive' class='text-base' onclick={increment}>
      Increment
    </Button>
    <Button variant='ghost' class='text-base' onclick={increment}>
      Increment
    </Button>
  </div>

  <div class='w-fit'>
    <h2 class='mb-4 text-center text-2xl text-primary font-bold'>Tech Stack</h2>
    <div class='flex flex-col gap-6'>
      {#each techStack as group (group.title)}
        <div>
          <h3 class='mb-3 text-xl text-secondary-foreground font-semibold'>{group.title}</h3>
          <ul class='flex flex-col items-start gap-2'>
            {#each group.items as tech (tech.name)}
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
      {/each}
    </div>
  </div>
</div>
