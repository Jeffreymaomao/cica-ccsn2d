#!/bin/bash -x
#SBATCH -J cftunnel
#SBATCH -p cpu
#SBATCH --nodes=1
#SBATCH --ntasks-per-node=1
#SBATCH --cpus-per-task=1
#SBATCH --time=240:00:00
#SBATCH --output=/lfs/data/changmao/cica-webpage/log/cftunnel-pnpm-%j.out

cd ${SLURM_SUBMIT_DIR}

# >>> conda initialize >>>
# !! Contents within this block are managed by 'conda init' !!
__conda_setup="$('/cluster/software/conda/py3.7_default/bin/conda' 'shell.bash' 'hook' 2> /dev/null)"
if [ $? -eq 0 ]; then
    eval "$__conda_setup"
else
    if [ -f "/cluster/software/conda/py3.7_default/etc/profile.d/conda.sh" ]; then
        . "/cluster/software/conda/py3.7_default/etc/profile.d/conda.sh"
    else
        export PATH="/cluster/software/conda/py3.7_default/bin:$PATH"
    fi
fi
unset __conda_setup
# <<< conda initialize <<<

conda activate node

PNPM=/cluster/home/changmao/.local/share/pnpm/pnpm

mkdir -p log

cloudflared tunnel run cica-tunnel > log/cftunnel.out 2>&1 &
$PNPM run dev 3333 > log/pnpm.out 2>&1 &

wait
