# Bora de Busao — versão 0.6

Nova marca: Bora de Busao (grafia solicitada, sem acento).
Azul naval #102A43 · laranja #F47721 · branco #FFFFFF.
Logo e ícone originais em public/brand, nos formatos SVG e PNG. Logo branca incluída para fundos escuros; ícone maskable para instalação. Manifesto, favicon, título e notificações atualizados.

## Atualização pelo celular
1. Envie Bora_de_Busao_Atualizacao_v0.6_sem_workflow.zip à raiz do repositório existente.
2. Abra .github/workflows/extrair.yml e substitua TODO o conteúdo pelo workflow enviado separadamente no chat. É necessário usar o workflow completo porque agora ele também salva os arquivos de marca e o manifesto; trocar apenas o nome do ZIP no workflow antigo não basta.
3. Confirme o commit e aguarde Actions ficar verde.
4. Confira a nova publicação no Cloudflare e reabra o site.

Aplicar sobre v0.5 (os arquivos de interface e a correção de sentidos estão incluídos). Não precisa renomear o repositório ou o Worker. O endereço do site permanece o mesmo. Favoritos, rotinas e endereços salvos são preservados por manter as chaves de armazenamento e a origem do site.
O ícone e o nome de um atalho já instalado podem demorar para atualizar; confira primeiro o site no navegador. Não limpe os dados do navegador, pois isso pode apagar os dados locais.

A versão altera marca e cores, sem criar o APK e sem implementar novos alertas em segundo plano. Busca por endereço e caminhada mantêm a dependência de configuração ORS já existente. Os mapas de terceiros mantêm suas próprias cores e créditos.

## Validação
Build de produção e verificação TypeScript aprovados. Logo inspecionada visualmente. Interface completa ainda deve ser conferida no celular após publicação; sem navegador automatizado nesta sessão.
