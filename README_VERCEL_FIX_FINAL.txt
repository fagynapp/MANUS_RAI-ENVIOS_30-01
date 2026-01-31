Correção de deploy (Vercel) aplicada:
1) Removido package-lock.json para impedir o Vercel de executar 'npm ci' (ele passa a usar 'npm install').
2) Fixado Node 20.x (package.json engines + .nvmrc).
3) Garantido 'vite' e '@vitejs/plugin-react' em dependencies (evita 'vite: command not found' mesmo se devDeps forem omitidas).
4) vercel.json com installCommand usando npm install.

Como aplicar:
- Suba estes arquivos para o GitHub (commit/push).
- No Vercel, confirme Node.js Version = 20.x.
- Faça Redeploy com Clear Cache.

No log do deploy, verifique que aparece 'npm install' (não 'npm ci').
