Vercel Fix aplicado:
- Node fixado em 20.x (package.json engines + .nvmrc)
- Vercel installCommand alterado para npm install --include=dev (evita travar no npm ci e garante vite)
- buildCommand = npm run build

Como aplicar:
1) Suba este projeto para o GitHub (commit/push)
2) No Vercel: Settings > General > Node.js Version = 20.x
3) Deployments > Redeploy (Clear cache)

Se der erro, copie do log as linhas de 'node -v' e 'npm -v' e me envie.
