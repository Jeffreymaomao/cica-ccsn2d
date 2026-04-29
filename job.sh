#!/bin/bash -x
#SBATCH -J cftunnel
#SBATCH -p cpu
#SBATCH --nodes=1
#SBATCH --ntasks-per-node=1
#SBATCH --cpus-per-task=1
#SBATCH --time=240:00:00
#SBATCH --output=/lfs/data/changmao/cica-webpage/log/cftunnel-pnpm-%j.out

cd ${SLURM_SUBMIT_DIR}

PNPM=/cluster/home/changmao/.local/share/pnpm/pnpm

mkdir -p log

cloudflared tunnel run cica-tunnel > log/cftunnel.out 2>&1 &
$PNPM run dev 3333 > log/pnpm.out 2>&1 &

wait
