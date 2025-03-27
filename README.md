# Visualização de Dados CPI e Core CPI

Este projeto apresenta uma visualização interativa dos índices de preços ao consumidor (CPI e Core CPI) de 2021 a 2025. O gráfico utiliza apenas HTML, CSS e JavaScript puro, sem dependências externas.

## Funcionalidades

- **Visualização Interativa**: Gráfico de linhas mostrando a evolução dos índices CPI e Core CPI ao longo do tempo
- **Animação Progressiva**: Opção para visualizar a evolução dos dados gradualmente
- **Controle de Timeline**: Navegue facilmente pelos diferentes períodos usando a barra deslizante
- **Recursos de Zoom**: Use a roda do mouse ou os controles na interface para ampliar/reduzir áreas específicas do gráfico
- **Navegação por Arrasto**: Arraste o gráfico para navegar quando o zoom estiver ativo
- **Tooltips Detalhados**: Passe o mouse sobre os pontos para ver informações detalhadas
- **Cards Informativos**: Exibição de valores e tendências atualizadas em tempo real

## Tecnologias Utilizadas

- HTML5 Canvas para renderização do gráfico
- CSS3 para estilização e animações
- JavaScript puro para interatividade e processamento de dados
- Arquitetura modulada e componentizada

## Como Executar

1. Clone este repositório
2. Abra o arquivo `index.html` em um navegador moderno
3. Alternativamente, execute um servidor web simples na pasta do projeto:
   ```
   python -m http.server 8080
   ```

## Estrutura do Projeto

- `index.html`: Estrutura básica da página
- `css/styles.css`: Estilos e animações
- `js/script.js`: Lógica de processamento de dados e renderização do gráfico
- `dados.csv`: Arquivo de dados com os valores de CPI e Core CPI

## Recursos Visuais

- Áreas coloridas sob as linhas do gráfico
- Gradientes e efeitos de sombra
- Animações de entrada e transição
- Design responsivo
- Interface intuitiva para controle da visualização

---

Desenvolvido para a disciplina de UX 