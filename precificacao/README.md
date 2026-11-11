# Pampo Print 3D — PWA

Aplicativo web instalável para cotação e precificação de impressão 3D. Os dados ficam no armazenamento local do navegador (`localStorage`); não há conta nem sincronização em nuvem.

## Como testar no computador

Abra `index.html` para uma prévia básica. Para testar recursos de PWA/service worker, execute um servidor local, por exemplo:

```bash
python -m http.server 8000
```

Depois acesse `http://localhost:8000`.

## Como instalar no celular

A instalação PWA exige que os arquivos estejam publicados em uma hospedagem HTTPS (localhost é exceção para teste).

1. Publique todos os arquivos desta pasta em um host estático HTTPS, mantendo a estrutura.
2. No Android, abra o endereço no Chrome e escolha **Instalar app** ou **Adicionar à tela inicial**.
3. No iPhone, abra o endereço no Safari, toque em **Compartilhar** e escolha **Adicionar à Tela de Início**.

## Recursos

- Configurações editáveis: preço do filamento por kg, material, tarifa de energia, potência da impressora e custo por hora.
- Cálculo de filamento, energia, custo bruto, embalagem, frete, preço sugerido e lucro estimado.
- Margem sobre preço de venda.
- Histórico local de até 500 cotações, carregar/excluir, exportar CSV e copiar resumo.
- Cache offline básico pelo service worker.

## Observações importantes

- O preço sugerido considera `preço = custo total / (1 - margem/100)`.
- O custo por hora é opcional e começa desativado.
- Impostos, taxas de marketplace, falhas de impressão, mão de obra e outros custos não são incluídos automaticamente.
- Os dados existem apenas neste navegador/dispositivo. Limpar os dados do navegador pode apagar o histórico. Exporte o CSV para guardar uma cópia.
- A logo no ícone é uma marca temporária tipográfica P3D. Substitua `icon.svg` pela identidade oficial se desejar.
