# Bora de Bus v0.4 — previsão com movimento observado

Atualização cumulativa: instale diretamente sobre a versão 0.2 ou 0.3. Não precisa aplicar a 0.3 antes.

## GitHub e Cloudflare
1. Envie Bora_de_Bus_Atualizacao_v0.4.zip para a raiz do repositório bora-de-bus, sem descompactar.
2. Abra .github/workflows/extrair.yml e substitua todo o conteúdo pelo workflow abaixo.
3. Faça Commit changes. Aguarde a execução verde em Actions e uma nova compilação na Cloudflare com os arquivos atualizados. Confirme o commit "Aplicar Bora de Bus v0.4". Se não houver nova compilação, salve uma pequena edição no README pelo GitHub para acionar a conexão; não use Retry de um build antigo sem conferir qual commit está sendo compilado.
4. Atualize a página do aplicativo. O histórico começa com as posições recebidas da fonte e acumula enquanto você consulta a linha.

```yaml
name: Atualizar Bora de Bus
on:
  workflow_dispatch:
  push:
    branches: [main]
    paths:
      - '.github/workflows/extrair.yml'
      - 'Bora_de_Bus_Atualizacao_v0.4.zip'
permissions:
  contents: write
jobs:
  atualizar:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Extrair atualização
        run: unzip -o Bora_de_Bus_Atualizacao_v0.4.zip
      - name: Salvar atualização
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add app lib scripts cloudflare/worker.ts cloudflare/mobility.ts ATUALIZAR.md
          git diff --cached --quiet || git commit -m "Aplicar Bora de Bus v0.4"
          git push
```

## O que a previsão considera
- Posições GPS sucessivas com o horário em que foram geradas no ônibus, não o horário em que chegaram ao servidor.
- Sentido e compatibilidade com o itinerário; descarta trajetos ambíguos, saltos impossíveis, posições antigas e intervalos longos sem GPS.
- Histórico recente recebido das fontes Conecta/Zirix, acrescido do histórico consultado nesta sessão. Até 20 minutos / 81 amostras por veículo no navegador.
- Tempo de passagem nos trechos: exige pelo menos dois veículos distintos com observações completas nos últimos 15 minutos. Usa mediana para reduzir efeito de valores extremos; a duração observada inclui atrasos e paradas ocorridos entre passagens.
- Nos trechos próximos sem observações completas, usa velocidade média de deslocamento de várias posições durante pelo menos 60 segundos, combinada com a tabela. Não usa uma leitura isolada de velocidade.
- Para trechos sem dados suficientes, conserva a tabela e identifica essa condição.
- Se há pelo menos três posições indicando parada por 60 segundos ou mais, suspende a previsão para pontos adiante até observar retomada. Ao lado do próprio ponto informa proximidade e saída não confirmada.
- Mostra faixa aproximada e origem da estimativa. A faixa é uma margem heurística, não intervalo estatístico validado.
- Planejador: para horários nos próximos 90 minutos, pode selecionar o mesmo ônibus no embarque e desembarque usando as faixas previstas, caminhada e margem de segurança. Sem candidato compatível, usa programação e informa isso. Para datas distantes não extrapola GPS atual.

## Funcionalidades incluídas da v0.3
Favoritos por linha e sentido separados das rotinas; previsão ao tocar no ponto; origem/destino; caminhos a pé e cálculo do ponto de menor caminhada entre até cinco candidatos próximos do itinerário carregado; botão Ver perto de mim.

## Endereços e caminhada: ativação separada
O novo cálculo de GPS não exige uma chave adicional. Para busca de endereço e caminhos reais a pé, crie a chave no https://openrouteservice.org/ e cadastre no projeto Cloudflare em Settings → Variables and Secrets → Add, tipo Secret, nome ORS_API_KEY. Salve/aplique. Não envie a chave em mensagens nem a coloque no GitHub.
A integração utiliza api.heigit.org. Sem chave, esses campos informam que o serviço aguarda ativação; GPS, favoritos e planejamento manual permanecem disponíveis. Respeite o plano e as cotas do provedor.

## O que ainda não está resolvido
Não é previsão oficial nem uma garantia de chegada. Não temos trânsito do Google, previsão de incidentes futuros, telemetria contínua 24h nem histórico centralizado de vários dias. Aprendizado é recente, por linha consultada e por sessão; ao fechar a aba, a coleta para. O histórico local não inclui endereço do usuário, somente posições públicas dos veículos. Rotinas continuam sendo horários fixos, sem push dinâmico com o app fechado. Endereços e geolocalização são enviados ao serviço de rotas quando usados.

## Verificações realizadas
Build Vite e TypeScript, empacotamento Worker dry-run; testes de filtro GPS, histórico, mudança de velocidade, parada, saltos, lacunas, sentido oposto, pontos ultrapassados, trajetos sobrepostos, mediana por trechos e planejamento com o mesmo veículo; cenários anteriores de horário programado.
Teste com resposta real da linha 613: seis veículos com histórico recente utilizável; previsões com movimento observado e tabela geradas para parte dos pontos. Não houve validação da precisão comparando previsão com chegada real, nem inspeção visual automatizada nesta execução. Endereços/caminhada permanecem testados com provedor simulado até configurar uma chave real.
