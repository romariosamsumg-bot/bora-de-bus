# Bora de Bus v0.2 — atualização
Este pacote atualiza somente a interface e o filtro do GPS. Não altera suas configurações Cloudflare, os dados GTFS ou as rotinas já salvas no navegador.

No GitHub, envie Bora_de_Bus_Atualizacao_v0.2.zip para a raiz do repositório. Edite .github/workflows/extrair.yml com o conteúdo abaixo e faça Commit changes. Aguarde a execução verde em Actions e o novo deploy na Cloudflare. Depois recarregue o site.

```yaml
name: Atualizar Bora de Bus
on:
  workflow_dispatch:
  push:
    paths:
      - '.github/workflows/extrair.yml'
      - 'Bora_de_Bus_Atualizacao_v0.2.zip'
permissions:
  contents: write
jobs:
  atualizar:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Extrair atualização
        run: unzip -o Bora_de_Bus_Atualizacao_v0.2.zip
      - name: Salvar atualização
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add app/bus-app.tsx app/bus-map.tsx app/globals.css lib/vehicles.ts scripts/vehicles.test.ts ATUALIZAR.md
          git diff --cached --quiet || git commit -m "Atualizar design e corrigir filtro GPS"
          git push
```

## O que mudou
- Mapa como tela inicial, busca de linha destacada, atalhos casa/trabalho, cores laranja e azul escuro e navegação inferior no celular.
- Todos os sentidos visíveis por padrão; filtro opcional respeita o sentido informado mesmo quando o identificador do trajeto GPS diverge do GTFS.
- Lista de veículos com idade do GPS, atualização ao retornar à página e descarte de posições antigas.
- Planejamento programado, pontos, margem de segurança, rotinas locais e exportação para agenda preservados.

## Validação
Build Vite, sete cenários do planejador, regressões de filtro GPS e empacotamento Worker dry-run. Sem inspeção visual automatizada nesta execução. O site público existente retornou seis veículos recentes para a linha 383 durante o diagnóstico. A correção ainda precisa ser publicada no seu repositório; não há acesso de escrita às suas contas nesta sessão.

## Limites
GPS recente não é previsão de chegada. Cálculo com trânsito, notificações dinâmicas em segundo plano e cobertura metropolitana ainda não estão implementados. GTFS fornecido válido até 31/12/2026. Sem posição atual, o aplicativo não inventa veículos.
