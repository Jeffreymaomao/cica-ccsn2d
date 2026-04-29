# Chiral Browser

Read-only Next.js browser for simulation outputs stored under a chiral data root.

## Development

```bash
conda activate node
pnpm run dev
pnpm run dev 3333
```

- `pnpm run dev` defaults to port `3030`
- `pnpm run dev 3333` starts on port `3333`

## Data Root

By default the app reads from `../chiral` relative to the project directory.

If you move this repo somewhere else, set `CHIRAL_ROOT` to the real data path:

```bash
export CHIRAL_ROOT=/lfs/data/changmao/chiral
conda activate node
pnpm run dev 3333
```

You can put the `export CHIRAL_ROOT=...` line in your `~/.zshrc` if you want it permanently.

## API

- `/api/runs`
- `/api/tree?run=<run>&path=<relative-path>`
- `/api/file?run=<run>&path=<relative-path>`
- `/api/download?run=<run>&path=<relative-path>`
