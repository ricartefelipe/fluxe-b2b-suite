# Imagem publicada pelo CI de node-b2b-orders (.github/workflows/build-push.yml, target worker).
# Permite deploy do worker a partir deste repositório (suite) sem duplicar o código fonte.
# Tag "develop" alinha com staging; para produção use imagem tag "master" ou a tag desejada.
FROM ghcr.io/ricartefelipe/node-b2b-orders-worker:develop
