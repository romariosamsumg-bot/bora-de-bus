# Bora de Bus · Rio de Janeiro

Versão inicial funcional, criada em 12/10/2026. Interface em português, responsiva, preparada como PWA e com uma edição independente para Cloudflare Workers.

## O que funciona

- Busca de 498 serviços da capital na cópia GTFS da SMTR de 08/08/2026 (7.722 pontos na base original).
- Seleção de linha, sentido, embarque e desembarque.
- Planejamento de uma linha direta: chegar até determinado horário ou embarcar a partir dele.
- Calendário de serviço, exceções, viagens após meia-noite e frequências.
- Caminhadas informadas pelo usuário e margem de segurança.
- Mapa OpenStreetMap com itinerário e posições GPS oficiais recentes do sentido selecionado quando a fonte permite identificá-lo.
- Adaptador de GPS Conecta e Zirix: cache de 60 segundos por instância, timeout, validação de coordenadas e timestamps, deduplicação por veículo.
- Rotinas locais editáveis por exclusão/criação, ativação, dias da semana e exportação ICS recorrente.
- Avisos de horário fixo enquanto a página está aberta. A agenda do celular pode avisar com o site fechado após importar o ICS.
- Manifesto PWA, ícones, service worker e instruções de instalação.

## Limitações reais — não anunciar como produto completo

- Nenhuma garantia de cobertura dos ônibus intermunicipais. Não foi confirmada uma API oficial pública que cubra toda a região metropolitana.
- GPS não é previsão de chegada no ponto. Apenas posições geradas há até 3 minutos são mostradas no mapa. Dados antigos ou sem sentido/shape compatível não são usados para inventar posições.
- Planejamento vem do GTFS, NÃO de trânsito ao vivo. Partidas derivadas de frequencies com exact_times=0 são referências por intervalo, não compromissos de horário. A interface identifica esse caso.
- As caminhadas são durações informadas; não há geocodificação de endereços ou roteamento de pedestres.
- Planejamento entre pontos de uma linha direta; sem transferências automáticas.
- Rotinas usam o horário fixo salvo: não recalculam programação para cada dia da semana nem feriados. Para dias com tabelas diferentes, calcule uma nova viagem.
- Não existe envio push no servidor, conta de usuário ou sincronização entre aparelhos. Permitir notificações não habilita envio em segundo plano.
- PWA exige conexão para dados e mapa; não é um APK ou app publicado em loja.
- Cópia do GTFS de 08/08/2026, com feed_end_date 31/12/2026. Os dados podem ter mudado. O planejamento bloqueia datas além desse limite.
- Verificação realizada: TypeScript, builds Sites/Cloudflare e testes de regras. Não foi feita inspeção visual em navegador neste ambiente.

## APIs e fontes pesquisadas

| Uso | Fonte | Situação |
|---|---|---|
| GPS SPPO | https://dados.mobilidade.rio/sppo/conecta/gps | Integrada; resposta HTTP 200 verificada durante o desenvolvimento |
| GPS SPPO | https://dados.mobilidade.rio/sppo/zirix/gps | Integrada; resposta HTTP 200 verificada durante o desenvolvimento |
| Linhas/pontos/horários | GTFS SMTR, espelhado em https://mobilitydatabase.org/feeds/gtfs/mdb-1791 | Importado; snapshot 08/08/2026 |
| Mapa | https://tile.openstreetmap.org/{z}/{x}/{y}.png | Integrado via Leaflet; atribuição preservada; sem pré-download ou cache offline de mapas |
| Planejar transporte por endereço e chegada | Google Routes API (TRANSIT) | Pesquisada; NÃO ativada, requer chave e faturamento |
| Notificações fechadas | Web Push + Service Worker + Cloudflare Cron + armazenamento de assinaturas | Arquitetura prevista, NÃO ativada |
| Intermunicipais | DETRO/operadores | Acesso, licença, cobertura e atualização ainda precisam ser confirmados |

Documentação oficial:
- https://www.data.rio/documents/2a5d133b3e914065b9ece3790f5e5685 (Conecta)
- https://www.data.rio/documents/fd2c79eaf6aa424aab2516f261c9ffda (Zirix)
- https://transportes.prefeitura.rio/subsidio/ (GTFS; o link DATA.RIO retornou 404 nesta pesquisa, por isso foi usada a cópia catalogada)
- https://developers.google.com/maps/documentation/routes/transit-route
- https://developers.google.com/maps/documentation/routes/usage-and-billing
- https://developer.mozilla.org/en-US/docs/Web/API/Push_API
- https://developers.cloudflare.com/workers/configuration/cron-triggers/
- https://operations.osmfoundation.org/policies/tiles/

Importante: Google Routes TRANSIT aceita arrivalTime, mas não aceita configurar as preferências TRAFFIC_AWARE de rotas de automóvel. Não prometer que somar uma rota de carro resolve a previsão de ônibus. A disponibilidade de dados e a precisão variam por região. Nenhuma API paga foi ativada.

## Rodar/publicar na sua conta Cloudflare

A pasta `cloudflare/` e `vite.cloudflare.ts` formam a edição independente. O pacote ZIP entregue contém apenas os arquivos necessários dessa edição, com scripts próprios em package.json.

1. Crie um repositório no GitHub e coloque o conteúdo do pacote na raiz, incluindo `public/data`.
2. No Cloudflare, abra Workers & Pages > Create > Import a repository e selecione o repositório.
3. Build command: `npm run build`. Deploy command: `npx wrangler deploy --config cloudflare/wrangler.jsonc`.
4. Node 22 ou superior; instale as dependências com `npm install` se a integração não fizer automaticamente.
5. O nome do Worker é `bora-de-bus-rio`; pode ser alterado em `cloudflare/wrangler.jsonc`.
6. Nenhuma chave é necessária para esta versão. Verifique os limites e custos atuais da sua conta antes de ampliar o público.

Isto é um Worker com assets, não apenas uma página HTML estática: publicar somente portable-dist sem o Worker deixa o GPS sem backend.

Comandos locais da edição Cloudflare:
```
npm install
npm run build
npm run deploy
```

Para o checkout original Sites, os comandos da edição independente são:
```
node node_modules/vite/bin/vite.js build --config vite.cloudflare.ts
node node_modules/wrangler/bin/wrangler.js deploy --config cloudflare/wrangler.jsonc
```

A hospedagem de teste Sites fica privada. A publicação na sua conta Cloudflare é separada e não foi executada.

## Atualizar GTFS

Baixe uma cópia atualizada da fonte autorizada, extraia os CSVs e execute:
```
python scripts/import-gtfs.py /caminho/dos/arquivos
```
Atualize também `snapshot` no importador, a validade/rotulagem no front-end e este documento. Revise licença e qualidade da fonte antes de republicar. O importador preserva horários e reduz apenas pontos da geometria para desenho do mapa. Em produção, automatize a validação e atualização do feed; não deixe a cópia ficar vencida.

## Próxima etapa para fechar o escopo

1. Confirmar fonte licenciada para linhas intermunicipais e adicionar adaptador por operador.
2. Implementar planejamento por endereço e transferências usando um motor de transporte (GTFS + roteamento de pedestres), ou provedor comercial com cobertura validada.
3. Estimar chegada usando progresso do veículo no itinerário, sentido, histórico por trecho e frescor do GPS, com intervalo de incerteza. Não usar distância em linha reta/velocidade instantânea.
4. Habilitar backend de rotinas, autenticação, consentimento, Web Push/VAPID, revogação de assinaturas e cron com deduplicação. Fuso America/Sao_Paulo; cron Cloudflare é UTC.
5. Recalcular rotinas de cada dia, emitir alertas de mudança e testar bateria, navegador suspenso, latência e ausência de sinal em aparelhos reais.
6. Testar acessibilidade, navegação, consumo de dados, mapa no Android/iOS e controle de custos antes de lançamento público.

## Privacidade e dados

Rotinas ficam no localStorage; a geolocalização só é solicitada por ação explícita e não é enviada ao backend de GPS. Mapa e fontes públicas recebem suas próprias consultas de rede. Não há analytics. Não armazene chaves privadas no código cliente. Os dados GTFS/GPS são de seus respectivos publicadores; este projeto não implica vínculo com a Prefeitura.
