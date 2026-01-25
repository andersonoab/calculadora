# CalculadoraEncargosCLT
# Calculadora de Descontos (INSS, IRRF e FGTS) – Modo Simples

Este projeto é uma calculadora web simples (HTML/CSS/JS) para estimar e conferir rapidamente INSS, IRRF e FGTS a partir de uma única entrada (salário do mês). O cálculo acontece automaticamente: digitou o valor, os resultados são atualizados sem precisar clicar em “Calcular”.

O objetivo é ser funcional para leigos (entrada única) e, ao mesmo tempo, permitir ajustes opcionais (dependentes, pensão, outras deduções, base FGTS e percentual FGTS) quando o usuário precisar bater com o holerite.

## Como usar (para leigos)

1. Abra o site.
2. Digite o “Salário do mês (R$)”.
3. Veja os resultados:
   - INSS esperado
   - IRRF final
   - FGTS esperado
   - Total de descontos (INSS + IRRF)
   - Líquido estimado (Salário - INSS - IRRF)

Pronto. Não precisa clicar em nada.

## Ajustes opcionais (quando necessário)

Abra “Ajustes opcionais” e preencha somente se fizer sentido:

- Competência/Tabela (2025 ou 2026)
- Tipo de cálculo (Mensal ou 13º)
- Dependentes
- Pensão alimentícia
- Outras deduções
- FGTS (%) (padrão 8%, pode ajustar para aprendiz 2% ou outro)
- Base FGTS (se for diferente do salário)

INSS:
- Por padrão o INSS está em “Auto”, calculado pela tabela progressiva.
- Se desligar o “Auto”, você pode digitar o INSS manualmente.

## O que o projeto entrega

- Entrada única (salário) com recálculo automático
- INSS progressivo (configurado no JS)
- IRRF por faixas (tabelas configuradas no JS)
- Opção de cálculo por “deduções legais” e “desconto simplificado”
- Redução 2026 (configurada no JS) com aplicação condicionada ao limite de renda
- Memória de cálculo (texto) para auditoria rápida e explicação do resultado
- Visualização rápida do IRRF antes x redução

## Arquivos do projeto

- index_validador.html
- style_validador.css
- app_validador.js

Se você vai substituir o projeto existente no GitHub Pages e manter o padrão de nomes, renomeie:
- index_validador.html -> index.html
- style_validador.css -> style.css
- app_validador.js -> app.js

## Rodando localmente

Opção simples:
- Abra o arquivo index_validador.html no navegador.

Opção recomendada (servidor local para evitar cache e facilitar testes):
- Se você tiver Python instalado:
  - No diretório do projeto, execute:
    - python -m http.server 8000
  - Depois acesse:
    - http://localhost:8000/index_validador.html

## Publicando no GitHub Pages

1. Crie/abra um repositório no GitHub.
2. Faça upload dos arquivos (ou substitua os existentes).
3. Vá em Settings > Pages.
4. Configure:
   - Branch: main (ou master)
   - Folder: / (root)
5. Aguarde a URL do Pages e acesse o site.

Se você já tem um Pages ativo, basta commitar os arquivos que o site atualiza.

## Configurações importantes (onde ajustar regras)

As regras/tabelas ficam no arquivo app_validador.js:

1) Tabelas do IRRF
Procure por:
- const TABELAS = { ... }

Ajuste:
- dependente
- isencao
- desconto_simplificado
- faixas (até, aliquota, deducao)
- redutor 2026 (base_min/base_max e reducao_min/reducao_max), se aplicável

2) Tabela do INSS
Procure por:
- const INSS_TABELA_2026 = [ ... ]

Ajuste os limites e alíquotas conforme o ano/competência desejada.

3) FGTS
O FGTS é calculado como:
- baseFGTS * (percentualFGTS/100)

Por padrão:
- percentual = 8
- baseFGTS = salário (se o campo “Base FGTS” estiver vazio)

## Limitações (honestidade de cálculo)

- O modo “entrada única” é uma estimativa padrão (dependentes = 0, pensão = 0, outras deduções = 0, FGTS = 8% e base FGTS = salário).
- Para bater com holerite real em 100% dos casos, pode ser necessário preencher ajustes opcionais e, dependendo do evento (férias, 13º, rescisão, verbas indenizatórias), a base e incidências podem mudar.
- As tabelas e redutores precisam ser atualizados conforme a legislação vigente. O projeto foi estruturado para essa manutenção ser fácil (centralizada no JS).

## Próximos upgrades recomendados

1) Validação contra holerite (modo conferência)
Adicionar campos opcionais:
- INSS do holerite
- IRRF do holerite
- FGTS recolhido

E exibir:
- Diferença (esperado x holerite)
- Alerta automático quando a diferença passar uma tolerância (ex.: R$ 1,00)

2) Módulo de rubricas/incidências
Adicionar uma lista de verbas com marcação:
- Incide INSS
- Incide IRRF
- Incide FGTS

E somar automaticamente a base por incidência para auditoria de parametrização.

## Licença e uso

Uso interno/educacional/operacional. Recomenda-se sempre validar parâmetros e legislação antes de usar como referência definitiva em decisões formais.

Autor/Organização do projeto: Anderson (Igarapé Digital)
