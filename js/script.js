// Variáveis globais
let dadosCompletos = null;
let dadosMostrados = {
    datas: [],
    cpiValores: [],
    coreCpiValores: []
};
let animando = false;
let indexAtual = 0;
let duracaoAnimacao = 30; // Duração da animação em ms (quanto menor, mais rápido)
let intervalId = null;

// Variáveis para controle de zoom e pan
let escalaZoom = 1;
let offsetX = 0;
let offsetY = 0;
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;
let minZoom = 1;
let maxZoom = 4;

document.addEventListener('DOMContentLoaded', () => {
    // Mostrar loading
    const loading = document.querySelector('.loading-animation');
    loading.style.display = 'flex';
    
    // Carregar dados
    carregarDados();
    
    // Configurar eventos dos controles
    configurarControles();
    
    // Configurar eventos de zoom e pan
    configurarZoomPan();
});

// Função para carregar os dados do CSV
async function carregarDados() {
    try {
        const resposta = await fetch('dados.csv');
        const dados = await resposta.text();
        
        // Processar os dados
        dadosCompletos = processarCSV(dados);
        
        // Inicializar com apenas o primeiro ponto de dados
        dadosMostrados = {
            datas: [dadosCompletos.datas[0]],
            cpiValores: [dadosCompletos.cpiValores[0]],
            coreCpiValores: [dadosCompletos.coreCpiValores[0]]
        };
        
        // Atualizar exibição inicial
        atualizarDataAtual(0);
        atualizarValoresAtuais(0);
        
        // Desenhar gráfico inicial
        desenharGrafico(dadosMostrados);
        
        // Esconder loading com animação de fade out
        const loading = document.querySelector('.loading-animation');
        loading.style.opacity = '0';
        setTimeout(() => {
            loading.style.display = 'none';
        }, 500);
        
    } catch (erro) {
        console.error('Erro ao carregar os dados:', erro);
        document.querySelector('.chart-container').innerHTML = '<p class="erro">Erro ao carregar os dados. Por favor, tente novamente mais tarde.</p>';
    }
}

// Função para processar os dados do CSV
function processarCSV(texto) {
    const linhas = texto.split('\n');
    const cabecalho = linhas[0].split(';');
    
    const datas = [];
    const cpiValores = [];
    const coreCpiValores = [];
    
    for (let i = 1; i < linhas.length; i++) {
        if (linhas[i].trim() === '') continue;
        
        const colunas = linhas[i].split(';');
        
        // Formatação de data para exibição (MM/YYYY)
        const dataOriginal = colunas[0].split('/');
        const dataFormatada = `${dataOriginal[1]}/${dataOriginal[2]}`;
        
        datas.push(dataFormatada);
        cpiValores.push(parseFloat(colunas[1].replace(',', '.')));
        coreCpiValores.push(parseFloat(colunas[2].replace(',', '.')));
    }
    
    return {
        datas,
        cpiValores,
        coreCpiValores
    };
}

// Função para configurar os controles
function configurarControles() {
    const btnPlay = document.getElementById('btn-play');
    const btnReset = document.getElementById('btn-reset');
    const timelineTrack = document.querySelector('.timeline-track');
    const timelineHandle = document.querySelector('.timeline-handle');
    
    // Botão de Play/Pause
    btnPlay.addEventListener('click', () => {
        if (animando) {
            pausarAnimacao();
            btnPlay.querySelector('.icon').textContent = '▶';
            btnPlay.querySelector('.label').textContent = 'Animar';
        } else {
            iniciarAnimacao();
            btnPlay.querySelector('.icon').textContent = '⏸';
            btnPlay.querySelector('.label').textContent = 'Pausar';
        }
    });
    
    // Botão de Reset
    btnReset.addEventListener('click', () => {
        resetarAnimacao();
        btnPlay.querySelector('.icon').textContent = '▶';
        btnPlay.querySelector('.label').textContent = 'Animar';
    });
    
    // Timeline - clique na barra
    timelineTrack.addEventListener('click', (e) => {
        if (dadosCompletos === null) return;
        
        const rect = timelineTrack.getBoundingClientRect();
        const cliquePorcentagem = (e.clientX - rect.left) / rect.width;
        const novoIndex = Math.round(cliquePorcentagem * (dadosCompletos.datas.length - 1));
        
        atualizarAteIndex(novoIndex);
    });
    
    // Timeline - arrastar handle
    let arrastando = false;
    
    timelineHandle.addEventListener('mousedown', () => {
        arrastando = true;
        pausarAnimacao();
        document.body.style.cursor = 'grabbing';
    });
    
    document.addEventListener('mouseup', () => {
        if (arrastando) {
            arrastando = false;
            document.body.style.cursor = 'default';
        }
    });
    
    document.addEventListener('mousemove', (e) => {
        if (arrastando && dadosCompletos !== null) {
            const rect = timelineTrack.getBoundingClientRect();
            let porcentagem = (e.clientX - rect.left) / rect.width;
            
            // Limitar entre 0 e 1
            porcentagem = Math.max(0, Math.min(1, porcentagem));
            
            const novoIndex = Math.round(porcentagem * (dadosCompletos.datas.length - 1));
            atualizarAteIndex(novoIndex);
        }
    });
}

// Função para iniciar a animação
function iniciarAnimacao() {
    if (animando || dadosCompletos === null) return;
    
    animando = true;
    
    if (indexAtual >= dadosCompletos.datas.length - 1) {
        resetarAnimacao();
    }
    
    intervalId = setInterval(() => {
        if (indexAtual < dadosCompletos.datas.length - 1) {
            indexAtual++;
            atualizarAteIndex(indexAtual);
        } else {
            pausarAnimacao();
            const btnPlay = document.getElementById('btn-play');
            btnPlay.querySelector('.icon').textContent = '▶';
            btnPlay.querySelector('.label').textContent = 'Animar';
        }
    }, duracaoAnimacao);
}

// Função para pausar a animação
function pausarAnimacao() {
    if (!animando) return;
    
    clearInterval(intervalId);
    animando = false;
}

// Função para resetar a animação
function resetarAnimacao() {
    pausarAnimacao();
    indexAtual = 0;
    atualizarAteIndex(0);
}

// Função para atualizar o gráfico até um determinado índice
function atualizarAteIndex(index) {
    if (dadosCompletos === null || index < 0 || index >= dadosCompletos.datas.length) return;
    
    indexAtual = index;
    
    // Atualizar dados mostrados
    dadosMostrados = {
        datas: dadosCompletos.datas.slice(0, index + 1),
        cpiValores: dadosCompletos.cpiValores.slice(0, index + 1),
        coreCpiValores: dadosCompletos.coreCpiValores.slice(0, index + 1)
    };
    
    // Atualizar interface
    atualizarTimelineProgress();
    atualizarDataAtual(index);
    atualizarValoresAtuais(index);
    
    // Desenhar gráfico
    desenharGrafico(dadosMostrados);
}

// Função para atualizar a posição da barra de progresso da timeline
function atualizarTimelineProgress() {
    if (dadosCompletos === null) return;
    
    const progressElement = document.querySelector('.timeline-progress');
    const handleElement = document.querySelector('.timeline-handle');
    
    const porcentagem = indexAtual / (dadosCompletos.datas.length - 1) * 100;
    
    progressElement.style.width = `${porcentagem}%`;
    handleElement.style.left = `${porcentagem}%`;
}

// Função para atualizar a data atual mostrada
function atualizarDataAtual(index) {
    if (dadosCompletos === null || index < 0 || index >= dadosCompletos.datas.length) return;
    
    const dataAtualElement = document.getElementById('data-atual');
    dataAtualElement.textContent = dadosCompletos.datas[index];
}

// Função para atualizar os valores atuais mostrados
function atualizarValoresAtuais(index) {
    if (dadosCompletos === null || index < 0 || index >= dadosCompletos.datas.length) return;
    
    const cpiValor = dadosCompletos.cpiValores[index];
    const coreCpiValor = dadosCompletos.coreCpiValores[index];
    
    // Atualizar valores na legenda
    document.getElementById('valor-cpi').textContent = cpiValor.toFixed(2) + '%';
    document.getElementById('valor-core-cpi').textContent = coreCpiValor.toFixed(2) + '%';
    
    // Atualizar valores nos cards
    document.getElementById('card-cpi-value').textContent = cpiValor.toFixed(2) + '%';
    document.getElementById('card-core-value').textContent = coreCpiValor.toFixed(2) + '%';
    
    // Calcular tendências (apenas se houver um índice anterior)
    if (index > 0) {
        const cpiAnterior = dadosCompletos.cpiValores[index - 1];
        const coreCpiAnterior = dadosCompletos.coreCpiValores[index - 1];
        
        const cpiDiff = cpiValor - cpiAnterior;
        const coreCpiDiff = coreCpiValor - coreCpiAnterior;
        
        // Atualizar tendências CPI
        const cpiTrendIcon = document.querySelector('#card-cpi-trend .trend-icon');
        const cpiTrendValue = document.querySelector('#card-cpi-trend .trend-value');
        
        if (cpiDiff > 0) {
            cpiTrendIcon.textContent = '▲';
            cpiTrendIcon.className = 'trend-icon trend-up';
            cpiTrendValue.textContent = '+' + cpiDiff.toFixed(2) + '%';
            cpiTrendValue.className = 'trend-value trend-up';
        } else if (cpiDiff < 0) {
            cpiTrendIcon.textContent = '▼';
            cpiTrendIcon.className = 'trend-icon trend-down';
            cpiTrendValue.textContent = cpiDiff.toFixed(2) + '%';
            cpiTrendValue.className = 'trend-value trend-down';
        } else {
            cpiTrendIcon.textContent = '–';
            cpiTrendIcon.className = 'trend-icon trend-neutral';
            cpiTrendValue.textContent = '0.00%';
            cpiTrendValue.className = 'trend-value trend-neutral';
        }
        
        // Atualizar tendências Core CPI
        const coreTrendIcon = document.querySelector('#card-core-trend .trend-icon');
        const coreTrendValue = document.querySelector('#card-core-trend .trend-value');
        
        if (coreCpiDiff > 0) {
            coreTrendIcon.textContent = '▲';
            coreTrendIcon.className = 'trend-icon trend-up';
            coreTrendValue.textContent = '+' + coreCpiDiff.toFixed(2) + '%';
            coreTrendValue.className = 'trend-value trend-up';
        } else if (coreCpiDiff < 0) {
            coreTrendIcon.textContent = '▼';
            coreTrendIcon.className = 'trend-icon trend-down';
            coreTrendValue.textContent = coreCpiDiff.toFixed(2) + '%';
            coreTrendValue.className = 'trend-value trend-down';
        } else {
            coreTrendIcon.textContent = '–';
            coreTrendIcon.className = 'trend-icon trend-neutral';
            coreTrendValue.textContent = '0.00%';
            coreTrendValue.className = 'trend-value trend-neutral';
        }
    }
}

// Função para desenhar o gráfico
function desenharGrafico(dados) {
    const canvas = document.getElementById('meuGrafico');
    const ctx = canvas.getContext('2d');
    
    // Definir tamanho do canvas
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    
    // Calcular dimensões úteis
    const largura = canvas.width;
    const altura = canvas.height;
    const margemEsquerda = 60;
    const margemDireita = 30;
    const margemSuperior = 30;
    const margemInferior = 60;
    
    // Área de desenho
    const areaDesenhoX = margemEsquerda;
    const areaDesenhoY = margemSuperior;
    const areaDesenhoLargura = largura - margemEsquerda - margemDireita;
    const areaDesenhoAltura = altura - margemSuperior - margemInferior;
    
    // Encontrar valores mínimos e máximos para escala (usando todos os dados completos para consistência)
    const todosValores = [...dadosCompletos.cpiValores, ...dadosCompletos.coreCpiValores];
    const valorMinimo = Math.floor(Math.min(...todosValores));
    const valorMaximo = Math.ceil(Math.max(...todosValores));
    
    // Limpar canvas
    ctx.clearRect(0, 0, largura, altura);
    
    // Adicionar texto de escala de zoom
    ctx.fillStyle = '#999';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`Zoom: ${escalaZoom.toFixed(1)}x`, largura - 10, 20);
    
    // Salvar o estado do contexto antes de aplicar transformações
    ctx.save();
    
    // Aplicar transformações de zoom e deslocamento
    // Apenas transforma a área do gráfico, não os eixos e legendas
    ctx.beginPath();
    ctx.rect(areaDesenhoX, areaDesenhoY, areaDesenhoLargura, areaDesenhoAltura);
    ctx.clip();
    
    // Aplicar transformação de zoom e deslocamento
    const centerX = areaDesenhoX + areaDesenhoLargura / 2;
    const centerY = areaDesenhoY + areaDesenhoAltura / 2;
    ctx.translate(centerX, centerY);
    ctx.scale(escalaZoom, escalaZoom); // Zoom em ambos os eixos para manter proporção
    ctx.translate(-centerX + offsetX, -centerY + offsetY);
    
    // Adicionar sombra e brilho ao fundo da área de gráfico
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    ctx.fillRect(areaDesenhoX, areaDesenhoY, areaDesenhoLargura, areaDesenhoAltura);
    ctx.shadowColor = 'transparent';
    
    // Desenhar grid dentro da área do gráfico
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#666';
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;
    
    const numLinhasHorizontais = 5;
    const intervaloY = areaDesenhoAltura / numLinhasHorizontais;
    const intervaloValor = (valorMaximo - valorMinimo) / numLinhasHorizontais;
    
    for (let i = 0; i <= numLinhasHorizontais; i++) {
        const y = areaDesenhoY + areaDesenhoAltura - (i * intervaloY);
        const valorY = valorMinimo + (i * intervaloValor);
        
        // Linha da grid
        ctx.beginPath();
        ctx.moveTo(areaDesenhoX, y);
        ctx.lineTo(areaDesenhoX + areaDesenhoLargura, y);
        ctx.stroke();
    }
    
    // Calcular intervalo para os rótulos do eixo X
    const totalDatas = dadosCompletos.datas.length;
    const intervaloX = areaDesenhoLargura / (totalDatas - 1) / escalaZoom;
    
    // Desenhar grid vertical com base no zoom
    const intervaloDatasMostrar = Math.max(1, Math.ceil(totalDatas / (12 * escalaZoom)));
    
    dadosCompletos.datas.forEach((data, index) => {
        if (index % intervaloDatasMostrar === 0 || index === totalDatas - 1) {
            const x = areaDesenhoX + (index * intervaloX * escalaZoom);
            
            // Linha de grid vertical
            ctx.beginPath();
            ctx.moveTo(x, areaDesenhoY);
            ctx.lineTo(x, areaDesenhoY + areaDesenhoAltura);
            ctx.stroke();
        }
    });
    
    // Função para converter valor para coordenada Y no canvas
    const valorParaY = (valor) => {
        return areaDesenhoY + areaDesenhoAltura - ((valor - valorMinimo) / (valorMaximo - valorMinimo) * areaDesenhoAltura);
    };
    
    // Desenhar área de fundo para CPI
    if (dados.cpiValores.length > 1) {
        ctx.beginPath();
        ctx.moveTo(areaDesenhoX, valorParaY(dados.cpiValores[0]));
        
        dados.cpiValores.forEach((valor, index) => {
            const x = areaDesenhoX + (index * intervaloX * escalaZoom);
            const y = valorParaY(valor);
            ctx.lineTo(x, y);
        });
        
        ctx.lineTo(areaDesenhoX + ((dados.cpiValores.length - 1) * intervaloX * escalaZoom), areaDesenhoY + areaDesenhoAltura);
        ctx.lineTo(areaDesenhoX, areaDesenhoY + areaDesenhoAltura);
        ctx.closePath();
        
        const gradient = ctx.createLinearGradient(0, areaDesenhoY, 0, areaDesenhoY + areaDesenhoAltura);
        gradient.addColorStop(0, 'rgba(41, 128, 185, 0.2)');
        gradient.addColorStop(1, 'rgba(41, 128, 185, 0.0)');
        
        ctx.fillStyle = gradient;
        ctx.fill();
    }
    
    // Desenhar área de fundo para Core CPI
    if (dados.coreCpiValores.length > 1) {
        ctx.beginPath();
        ctx.moveTo(areaDesenhoX, valorParaY(dados.coreCpiValores[0]));
        
        dados.coreCpiValores.forEach((valor, index) => {
            const x = areaDesenhoX + (index * intervaloX * escalaZoom);
            const y = valorParaY(valor);
            ctx.lineTo(x, y);
        });
        
        ctx.lineTo(areaDesenhoX + ((dados.coreCpiValores.length - 1) * intervaloX * escalaZoom), areaDesenhoY + areaDesenhoAltura);
        ctx.lineTo(areaDesenhoX, areaDesenhoY + areaDesenhoAltura);
        ctx.closePath();
        
        const gradient = ctx.createLinearGradient(0, areaDesenhoY, 0, areaDesenhoY + areaDesenhoAltura);
        gradient.addColorStop(0, 'rgba(231, 76, 60, 0.1)');
        gradient.addColorStop(1, 'rgba(231, 76, 60, 0.0)');
        
        ctx.fillStyle = gradient;
        ctx.fill();
    }
    
    // Desenhar linha CPI
    if (dados.cpiValores.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = '#2980b9';
        ctx.lineWidth = 3;
        
        dados.cpiValores.forEach((valor, index) => {
            const x = areaDesenhoX + (index * intervaloX * escalaZoom);
            const y = valorParaY(valor);
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        // Adicionar sombra à linha
        ctx.shadowColor = 'rgba(41, 128, 185, 0.5)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;
        ctx.stroke();
        ctx.shadowColor = 'transparent';
    }
    
    // Desenhar linha Core CPI
    if (dados.coreCpiValores.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 3;
        
        dados.coreCpiValores.forEach((valor, index) => {
            const x = areaDesenhoX + (index * intervaloX * escalaZoom);
            const y = valorParaY(valor);
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        // Adicionar sombra à linha
        ctx.shadowColor = 'rgba(231, 76, 60, 0.5)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;
        ctx.stroke();
        ctx.shadowColor = 'transparent';
    }
    
    // Desenhar pontos nos dados com efeito de animação
    dados.cpiValores.forEach((valor, index) => {
        const x = areaDesenhoX + (index * intervaloX * escalaZoom);
        const y = valorParaY(valor);
        
        ctx.beginPath();
        
        // Destaque para o último ponto
        const tamanho = index === dados.cpiValores.length - 1 ? 6 : 4;
        
        ctx.arc(x, y, tamanho, 0, Math.PI * 2);
        
        // Gradiente para o ponto
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, tamanho);
        gradient.addColorStop(0, '#3498db');
        gradient.addColorStop(1, '#2980b9');
        
        ctx.fillStyle = gradient;
        
        // Adicionar sombra ao ponto
        ctx.shadowColor = 'rgba(41, 128, 185, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;
        
        ctx.fill();
        ctx.shadowColor = 'transparent';
        
        // Adicionar borda branca
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
    });
    
    dados.coreCpiValores.forEach((valor, index) => {
        const x = areaDesenhoX + (index * intervaloX * escalaZoom);
        const y = valorParaY(valor);
        
        ctx.beginPath();
        
        // Destaque para o último ponto
        const tamanho = index === dados.coreCpiValores.length - 1 ? 6 : 4;
        
        ctx.arc(x, y, tamanho, 0, Math.PI * 2);
        
        // Gradiente para o ponto
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, tamanho);
        gradient.addColorStop(0, '#e67e22');
        gradient.addColorStop(1, '#e74c3c');
        
        ctx.fillStyle = gradient;
        
        // Adicionar sombra ao ponto
        ctx.shadowColor = 'rgba(231, 76, 60, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;
        
        ctx.fill();
        ctx.shadowColor = 'transparent';
        
        // Adicionar borda branca
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
    });
    
    // Restaurar o contexto para desenhar eixos e legendas
    ctx.restore();
    
    // Desenhar eixos
    ctx.beginPath();
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    
    // Eixo X
    ctx.moveTo(areaDesenhoX, areaDesenhoY + areaDesenhoAltura);
    ctx.lineTo(areaDesenhoX + areaDesenhoLargura, areaDesenhoY + areaDesenhoAltura);
    
    // Eixo Y
    ctx.moveTo(areaDesenhoX, areaDesenhoY);
    ctx.lineTo(areaDesenhoX, areaDesenhoY + areaDesenhoAltura);
    ctx.stroke();
    
    // Desenhar rótulos do eixo Y 
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#666';
    
    for (let i = 0; i <= numLinhasHorizontais; i++) {
        const y = areaDesenhoY + areaDesenhoAltura - (i * intervaloY);
        const valorY = valorMinimo + (i * intervaloValor);
        
        // Rótulo do eixo Y
        ctx.fillText(valorY.toFixed(1) + '%', areaDesenhoX - 5, y + 5);
    }
    
    // Desenhar rótulos eixo X ajustados para o zoom
    ctx.textAlign = 'center';
    ctx.fillStyle = '#666';
    
    // Título do eixo X e Y
    ctx.fillText('Tempo', areaDesenhoX + areaDesenhoLargura / 2, altura - 10);
    
    ctx.save();
    ctx.translate(15, areaDesenhoY + areaDesenhoAltura / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Índice (%)', 0, 0);
    ctx.restore();
    
    // Adicionar interatividade
    adicionarInteratividade(canvas, dados, areaDesenhoX, intervaloX * escalaZoom, valorParaY);
}

// Função para adicionar interatividade ao gráfico
function adicionarInteratividade(canvas, dados, areaDesenhoX, intervaloX, valorParaY) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.style.display = 'none';
    document.body.appendChild(tooltip);
    
    // Adicionar evento de movimento do mouse
    canvas.addEventListener('mousemove', (e) => {
        if (isDragging) {
            // Se estiver arrastando, não mostrar tooltip
            tooltip.style.display = 'none';
            return;
        }
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Converter a posição do mouse para o espaço do gráfico considerando o zoom
        const margemEsquerda = 60;
        const margemSuperior = 30;
        const centerX = margemEsquerda + (canvas.width - margemEsquerda - 30) / 2;
        const centerY = margemSuperior + (canvas.height - margemSuperior - 60) / 2;
        
        // Calcular a posição real considerando o zoom e offset
        const posicaoRealX = (x - centerX) / escalaZoom + centerX - offsetX;
        const posicaoRealY = (y - centerY) / escalaZoom + centerY - offsetY;
        
        // Encontrar ponto mais próximo
        const posicaoIndex = Math.round((posicaoRealX - areaDesenhoX) / (intervaloX / escalaZoom));
        
        if (posicaoIndex >= 0 && posicaoIndex < dados.datas.length) {
            const dataCompleta = dados.datas[posicaoIndex];
            const cpiValor = dados.cpiValores[posicaoIndex];
            const coreCpiValor = dados.coreCpiValores[posicaoIndex];
            
            // Calcular tendência em relação ao mês anterior (se disponível)
            let cpiTendencia = '';
            let coreTendencia = '';
            
            if (posicaoIndex > 0) {
                const cpiAnterior = dados.cpiValores[posicaoIndex - 1];
                const coreAnterior = dados.coreCpiValores[posicaoIndex - 1];
                
                const cpiDiff = cpiValor - cpiAnterior;
                const coreDiff = coreCpiValor - coreAnterior;
                
                cpiTendencia = cpiDiff > 0 ? 
                    `<span style="color:#27ae60">▲ +${cpiDiff.toFixed(2)}%</span>` : 
                    (cpiDiff < 0 ? `<span style="color:#c0392b">▼ ${cpiDiff.toFixed(2)}%</span>` : '');
                
                coreTendencia = coreDiff > 0 ? 
                    `<span style="color:#27ae60">▲ +${coreDiff.toFixed(2)}%</span>` : 
                    (coreDiff < 0 ? `<span style="color:#c0392b">▼ ${coreDiff.toFixed(2)}%</span>` : '');
            }
            
            // Adicionar classes de animação ao tooltip
            tooltip.style.display = 'block';
            tooltip.style.opacity = '0'; 
            tooltip.style.transform = 'translateY(10px)';
            tooltip.style.left = (e.clientX + 15) + 'px';
            tooltip.style.top = (e.clientY - 25) + 'px';
            tooltip.style.transition = 'opacity 0.2s, transform 0.2s';
            tooltip.innerHTML = `
                <div style="font-weight:bold;margin-bottom:5px;font-size:16px;">${dataCompleta}</div>
                <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
                    <span style="color:#2980b9;font-weight:bold;">CPI:</span>
                    <span>${cpiValor.toFixed(2)}% ${cpiTendencia}</span>
                </div>
                <div style="display:flex;justify-content:space-between;">
                    <span style="color:#e74c3c;font-weight:bold;">Core CPI:</span>
                    <span>${coreCpiValor.toFixed(2)}% ${coreTendencia}</span>
                </div>
            `;
            
            // Animar entrada do tooltip
            setTimeout(() => {
                tooltip.style.opacity = '1';
                tooltip.style.transform = 'translateY(0)';
            }, 10);
            
            // Atualizar dados somente se estiver navegando manualmente (não durante animação)
            if (!animando) {
                atualizarDataAtual(posicaoIndex);
                atualizarValoresAtuais(posicaoIndex);
            }
        } else {
            tooltip.style.display = 'none';
        }
    });
    
    canvas.addEventListener('mouseout', () => {
        tooltip.style.display = 'none';
    });
    
    // Detectar clique no canvas para navegar até um ponto específico
    canvas.addEventListener('click', (e) => {
        // Não processar o clique se estiver arrastando
        if (animando || isDragging) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Converter a posição do mouse para o espaço do gráfico considerando o zoom
        const margemEsquerda = 60;
        const margemSuperior = 30;
        const centerX = margemEsquerda + (canvas.width - margemEsquerda - 30) / 2;
        const centerY = margemSuperior + (canvas.height - margemSuperior - 60) / 2;
        
        // Calcular a posição real considerando o zoom e offset
        const posicaoRealX = (x - centerX) / escalaZoom + centerX - offsetX;
        
        // Encontrar ponto mais próximo
        const posicaoIndex = Math.round((posicaoRealX - areaDesenhoX) / (intervaloX / escalaZoom));
        
        if (posicaoIndex >= 0 && posicaoIndex < dadosCompletos.datas.length) {
            atualizarAteIndex(posicaoIndex);
        }
    });
    
    // Estilizar o tooltip com CSS
    const style = document.createElement('style');
    style.textContent = `
        .tooltip {
            position: absolute;
            background: rgba(44, 62, 80, 0.95);
            color: white;
            padding: 12px;
            border-radius: 6px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            border-left: 3px solid var(--cpi-color);
            font-size: 14px;
            max-width: 250px;
            backdrop-filter: blur(5px);
            z-index: 100;
            pointer-events: none;
        }
    `;
    document.head.appendChild(style);
}

// Função para configurar zoom e pan
function configurarZoomPan() {
    const canvas = document.getElementById('meuGrafico');
    
    // Capturar eventos de roda do mouse para zoom
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        
        // Determinar direção do zoom (positivo = zoom in, negativo = zoom out)
        const delta = Math.sign(e.deltaY) * -0.1;
        const novaEscala = Math.max(minZoom, Math.min(maxZoom, escalaZoom + delta));
        
        // Apenas atualiza se a escala mudou
        if (novaEscala !== escalaZoom) {
            // Calcular posição do mouse relativa ao canvas
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            // Aplicar zoom centralizado no mouse
            aplicarZoom(novaEscala, mouseX, mouseY);
        }
    });
    
    // Capturar eventos de mouse para arrastar o gráfico
    canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        canvas.classList.add('grabbing');
    });
    
    canvas.addEventListener('mousemove', (e) => {
        if (isDragging) {
            // Calcular o deslocamento
            const deltaX = e.clientX - lastMouseX;
            const deltaY = e.clientY - lastMouseY;
            
            // Atualizar o offset apenas se o zoom for > 1
            if (escalaZoom > 1) {
                offsetX += deltaX / escalaZoom;
                offsetY += deltaY / escalaZoom;
                
                // Limitar o offset para não sair dos limites do gráfico
                const maxOffsetX = (canvas.width * (1 - 1/escalaZoom)) / 2;
                const maxOffsetY = (canvas.height * (1 - 1/escalaZoom)) / 2;
                
                offsetX = Math.max(-maxOffsetX, Math.min(maxOffsetX, offsetX));
                offsetY = Math.max(-maxOffsetY, Math.min(maxOffsetY, offsetY));
                
                // Redesenhar o gráfico
                desenharGrafico(dadosMostrados);
            }
            
            // Atualizar a última posição do mouse
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
        }
    });
    
    canvas.addEventListener('mouseup', () => {
        isDragging = false;
        canvas.classList.remove('grabbing');
    });
    
    canvas.addEventListener('mouseleave', () => {
        isDragging = false;
        canvas.classList.remove('grabbing');
    });
    
    // Adicionar instruções de zoom
    const container = document.querySelector('.container');
    const instrucoes = document.createElement('p');
    instrucoes.className = 'instructions';
    instrucoes.textContent = 'Use a roda do mouse para ampliar/reduzir e arraste para navegar pelo gráfico';
    
    // Adicionar controles de zoom
    const zoomControls = document.createElement('div');
    zoomControls.className = 'zoom-controls';
    
    // Botão de zoom in
    const zoomInBtn = document.createElement('button');
    zoomInBtn.className = 'zoom-btn';
    zoomInBtn.innerHTML = '<span>🔍+</span>';
    zoomInBtn.title = 'Aumentar zoom';
    zoomInBtn.addEventListener('click', () => {
        const novaEscala = Math.min(maxZoom, escalaZoom + 0.5);
        if (novaEscala !== escalaZoom) {
            const canvas = document.getElementById('meuGrafico');
            aplicarZoom(novaEscala, canvas.width / 2, canvas.height / 2);
        }
    });
    
    // Botão de zoom out
    const zoomOutBtn = document.createElement('button');
    zoomOutBtn.className = 'zoom-btn';
    zoomOutBtn.innerHTML = '<span>🔍-</span>';
    zoomOutBtn.title = 'Diminuir zoom';
    zoomOutBtn.addEventListener('click', () => {
        const novaEscala = Math.max(minZoom, escalaZoom - 0.5);
        if (novaEscala !== escalaZoom) {
            const canvas = document.getElementById('meuGrafico');
            aplicarZoom(novaEscala, canvas.width / 2, canvas.height / 2);
        }
    });
    
    // Botão de reset zoom
    const zoomResetBtn = document.createElement('button');
    zoomResetBtn.className = 'zoom-btn';
    zoomResetBtn.innerHTML = '<span>↺ Reset</span>';
    zoomResetBtn.title = 'Resetar zoom';
    zoomResetBtn.addEventListener('click', () => {
        escalaZoom = 1;
        offsetX = 0;
        offsetY = 0;
        desenharGrafico(dadosMostrados);
    });
    
    // Display de nível de zoom
    const zoomLevel = document.createElement('div');
    zoomLevel.className = 'zoom-level';
    zoomLevel.id = 'zoom-level';
    zoomLevel.textContent = `Zoom: ${escalaZoom.toFixed(1)}x`;
    
    // Atualizar o display de zoom sempre que o zoom mudar
    const observeZoom = () => {
        zoomLevel.textContent = `Zoom: ${escalaZoom.toFixed(1)}x`;
        requestAnimationFrame(observeZoom);
    };
    observeZoom();
    
    // Adicionar botões ao container
    zoomControls.appendChild(zoomOutBtn);
    zoomControls.appendChild(zoomLevel);
    zoomControls.appendChild(zoomInBtn);
    zoomControls.appendChild(zoomResetBtn);
    
    // Inserir os elementos na ordem correta
    const chartContainer = document.querySelector('.chart-container');
    container.insertBefore(instrucoes, chartContainer);
    container.insertBefore(zoomControls, instrucoes);
}

// Função para aplicar zoom
function aplicarZoom(novaEscala, mouseX, mouseY) {
    // Salvar a escala antiga
    const escalaAntiga = escalaZoom;
    
    // Atualizar a escala
    escalaZoom = novaEscala;
    
    // Atualizar o offset para manter o ponto sob o mouse fixo
    if (escalaAntiga !== novaEscala) {
        const canvas = document.getElementById('meuGrafico');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Calcular o novo offset baseado na posição do mouse
        const mouseOffsetX = (mouseX - centerX);
        const mouseOffsetY = (mouseY - centerY);
        offsetX = offsetX * (novaEscala / escalaAntiga) - mouseOffsetX * (1 / escalaAntiga - 1 / novaEscala);
        offsetY = offsetY * (novaEscala / escalaAntiga) - mouseOffsetY * (1 / escalaAntiga - 1 / novaEscala);
        
        // Limitar o offset para não sair dos limites do gráfico
        const maxOffsetX = (canvas.width * (1 - 1/escalaZoom)) / 2;
        const maxOffsetY = (canvas.height * (1 - 1/escalaZoom)) / 2;
        
        offsetX = Math.max(-maxOffsetX, Math.min(maxOffsetX, offsetX));
        offsetY = Math.max(-maxOffsetY, Math.min(maxOffsetY, offsetY));
        
        // Redesenhar o gráfico
        desenharGrafico(dadosMostrados);
    }
} 