# Pampo Controle Financeiro — PWA

Este projeto é uma versão web instalável do controle financeiro.

## Como publicar
Envie estes arquivos para qualquer hospedagem de site com HTTPS (por exemplo, uma hospedagem estática). Depois abra o endereço no celular.

## Instalação no celular
### Android
Abra o endereço no Chrome → menu ⋮ → "Adicionar à tela inicial" ou "Instalar app".

### iPhone
Abra no Safari → Compartilhar → "Adicionar à Tela de Início".

## Dados
Os lançamentos são armazenados localmente no navegador/aparelho usando localStorage. Para um sistema multi-dispositivo com login e sincronização, será necessário adicionar um banco de dados/backend.

## Regra
Restante para gastar = Entradas - Despesas - Lazer - Reservas.

A análise usa 50% Despesas, 30% Lazer e 20% Reservas.


## Nova regra de saldo acumulado
A sobra de um mês é automaticamente carregada para o mês seguinte.

**Saldo disponível = Entradas do mês + sobra acumulada dos meses anteriores − Despesas − Lazer − Reservas.**

Exemplo: se outubro terminar com R$ 500 de sobra, novembro começa com os R$ 500 somados às entradas de novembro. Se novembro terminar com mais R$ 300, dezembro receberá R$ 800 de saldo acumulado.


## Regra definitiva de saldo acumulado
O aplicativo trabalha com saldo acumulado mês a mês.

- Outubro termina com R$ 300 de sobra.
- Novembro recebe R$ 100 e não gasta nada.
- Novembro termina com R$ 400.
- Dezembro começa com R$ 400.
- Se dezembro receber mais R$ 200 e não gastar, janeiro começa com R$ 600.

A fórmula é:

**Saldo final do mês = saldo acumulado anterior + entradas − despesas − lazer − reservas**

Somente saldo positivo é carregado para o mês seguinte. Um saldo negativo não é transformado em "dívida" dentro do saldo disponível do mês seguinte.


## Visualização do saldo anterior
Na tela inicial, abaixo de Total de Entradas e Despesas, o app mostra em letra pequena o "Saldo mês anterior (mês)" para deixar claro a origem do valor carregado.
