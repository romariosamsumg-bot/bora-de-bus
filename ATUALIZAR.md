# Bora de Bus — atualização 0.5

Aplicar sobre a versão 0.4 ou 0.4.1. A correção de todos os sentidos, ida e volta já está incluída. Não é necessário instalar a 0.4.1 antes.

## Atualizar pelo celular
1. Envie Bora_de_Bus_Atualizacao_v0.5.zip para a raiz do seu repositório no GitHub, mantendo o nome exato.
2. Edite .github/workflows/extrair.yml. Troque todas as referências ao ZIP anterior (v0.4.zip ou v0.4.1.zip) por Bora_de_Bus_Atualizacao_v0.5.zip. Salve em Commit changes. O arquivo workflow-v05.txt neste pacote contém o workflow completo de referência.
3. Aguarde Actions ficar verde. Isso confirma a extração e o commit dos arquivos.
4. No Cloudflare, confira se um novo build publicou o commit atualizado. O verde no GitHub sozinho não confirma a publicação do site.
5. Reabra o site e confira se o menu mostra Favoritos e o mapa ocupa toda a área acima da navegação inferior.

## O que mudou
- Mapa inteiro, busca flutuante e filtros Todos os sentidos / Ida / Volta.
- Painel inferior expansível; toque em ônibus ou ponto para consultar seus detalhes. A informação do ponto corresponde ao momento do toque; toque novamente para atualizar.
- Planejar com campos de origem e destino, atalhos Casa e Trabalho e pontos sugeridos após escolher endereços, respeitando a linha e o sentido. Pontos manuais continuam disponíveis.
- Endereços de Casa e Trabalho salvos neste navegador. A seleção atual permanece durante a sessão ao trocar de linha ou aba.
- Resultado com horário de saída, caminhada, embarque e destino; botão Ver trajeto.
- Favoritos compactos, consulta de ponto próximo, caminhada e previsão quando os dados permitem; remover e desfazer.
- Rotinas com criação, edição de nome, dias e horário fixo; explicação de avisos recolhida em Como funcionam os avisos.
- Menos textos repetidos; fontes e limites em Sobre e preferências (ícone de ajustes no cabeçalho).

## Serviços e limites
Mantém Leaflet e OpenStreetMap. Não adiciona Google Maps nem contrata serviços pagos.
Busca por endereço e cálculo de caminhada ainda dependem da configuração existente ORS_API_KEY no Worker. A atualização não cria essa chave. Se o serviço não estiver ativado, use os pontos e minutos de caminhada manualmente; nos favoritos será indicado quando o ponto foi escolhido pela distância em linha reta, sem estimativa de caminhada.
Previsões dependem de GPS recente e compatível. Não há garantia de chegada ou dados de trânsito do Google. Rotinas continuam com horário fixo e avisos com a página aberta; agenda é uma exportação separada. Ao editar uma rotina, atualize também o lembrete na agenda.
Favoritos e rotinas anteriores são preservados. Limpar dados do navegador pode apagá-los. Configuração do Worker e chaves não são alteradas.

## Verificação
Build de produção e TypeScript passaram. Passaram 12 verificações de filtros, 7 de chegada/projeção e 15 de histórico observado. Não houve validação visual automatizada em navegador nesta sessão.
Após publicar: confira busca, três sentidos, detalhes de ponto, origem/destino, favoritos e edição de rotina no celular.
