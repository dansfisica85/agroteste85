async function fetchNasaPowerData(latitude, longitude, startDate, endDate) {
    const response = await fetch(`https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,PRECTOTCORR,ALLSKY_SFC_SW_DWN&community=AG&longitude=${longitude}&latitude=${latitude}&start=${startDate}&end=${endDate}&format=JSON`);
    const data = await response.json();
    return data.properties.parameter;
}

async function calcular() {
    const latitude = parseFloat(document.getElementById('latitude').value);
    const longitude = parseFloat(document.getElementById('longitude').value);
    const cc = parseFloat(document.getElementById('cc').value);
    const pi = parseFloat(document.getElementById('pi').value);
    const apartirCicloCul = parseFloat(document.getElementById('apartirCicloCul').value);
    const ateCicloCul = parseFloat(document.getElementById('ateCicloCul').value) || apartirCicloCul;
    const pua = parseFloat(document.getElementById('pua').value);

    // Mostrar barra de carregamento
    document.getElementById('loading').style.display = 'block';
    let progress = 0;
    const interval = setInterval(() => {
        if (progress < 90) {
            progress += 1;
            updateProgressBar(progress);
        }
    }, 100);

    // Obter dados climáticos da API POWER da NASA para os últimos 7 dias
    const endDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const startDate = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0].replace(/-/g, '');

    const nasaData = await fetchNasaPowerData(latitude, longitude, startDate, endDate);

    const temperatureData = nasaData.T2M;
    const precipitationData = nasaData.PRECTOTCORR;
    const solarRadiationData = nasaData.ALLSKY_SFC_SW_DWN;

    // Atualizar barra de progresso
    updateProgressBar(50);

    // Calcular médias dos dados climáticos
    const temperatureAvg = calculateAverage(Object.values(temperatureData));
    const precipitationAvg = calculateAverage(Object.values(precipitationData));
    const solarRadiationAvg = calculateAverage(Object.values(solarRadiationData));

    // Calcular evapotranspiração usando a fórmula de Hargreaves
    const mf = solarRadiationAvg; // Usando a radiação solar como fator mensal
    const t = temperatureAvg;
    const ur = pua; // Usando a umidade do ar como umidade relativa média mensal
    const etp = calcularEvapotranspiracao(mf, t, ur);

    // Cálculo de Água Disponível inicial (AD)
    const ad = (cc - pi) / 10;

    // Cálculo da Porcentagem Final de Acerto no Dia (PFAD)
    const pfad = ad + ((apartirCicloCul + ateCicloCul) / 2) * ((100 - etp) / 100) * pua;

    // Loop para calcular a perda diária de umidade
    const dias = 7; // Exemplo: 7 dias
    let umidadeAtual = pi;
    let precipitacaoTotal = 0;
    const precipitacaoDiariaArray = [];
    const evapotranspiracaoDiariaArray = [];

    for (let i = 0; i < dias; i++) {
        const precipitacaoDiaria = precipitationData[Object.keys(precipitationData)[i]];
        umidadeAtual += precipitacaoDiaria;
        umidadeAtual -= etp / 30; // Evapotranspiração diária
        precipitacaoTotal += precipitacaoDiaria;
        precipitacaoDiariaArray.push(precipitacaoDiaria);
        evapotranspiracaoDiariaArray.push(etp / 30);
    }

    // Atualizar barra de progresso
    updateProgressBar(100);
    clearInterval(interval);

    // Ocultar barra de carregamento
    document.getElementById('loading').style.display = 'none';

    // Exibir resultados em uma tabela
    document.getElementById('result').innerHTML = `
        <h3>Resultados:</h3>
        <table>
            <tr>
                <th>Descrição</th>
                <th>Valor</th>
            </tr>
            <tr>
                <td>Água Disponível Inicial (AD)</td>
                <td>${ad.toFixed(2)} mm</td>
            </tr>
            <tr>
                <td>Porcentagem Final de Acerto no Dia (PFAD)</td>
                <td>${pfad.toFixed(2)} %</td>
            </tr>
            <tr>
                <td>Precipitação Total nos ${dias} dias</td>
                <td>${precipitacaoTotal.toFixed(2)} mm</td>
            </tr>
            <tr>
                <td>Umidade Final após ${dias} dias</td>
                <td>${umidadeAtual.toFixed(2)} %</td>
            </tr>
        </table>
    `;

    // Gerar gráfico de evaporação por precipitação
    const ctx = document.getElementById('evaporationChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({ length: dias }, (_, i) => `Dia ${i + 1}`),
            datasets: [
                {
                    label: 'Precipitação Diária (mm)',
                    data: precipitacaoDiariaArray,
                    borderColor: 'blue',
                    backgroundColor: 'rgba(0, 0, 255, 0.1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'blue',
                    pointBorderColor: 'blue',
                    pointRadius: 5,
                    fill: true
                },
                {
                    label: 'Evapotranspiração Diária (mm)',
                    data: evapotranspiracaoDiariaArray,
                    borderColor: 'red',
                    backgroundColor: 'rgba(255, 0, 0, 0.1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'red',
                    pointBorderColor: 'red',
                    pointRadius: 5,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Gráfico de Evaporação por Precipitação'
                },
                legend: {
                    display: true,
                    position: 'top',
                    onClick: (e, legendItem, legend) => {
                        const index = legendItem.datasetIndex;
                        const ci = legend.chart;
                        const meta = ci.getDatasetMeta(index);

                        // Toggle the visibility
                        meta.hidden = meta.hidden === null ? !ci.data.datasets[index].hidden : null;

                        // Update the chart
                        ci.update();
                    }
                },
                tooltip: {
                    enabled: true,
                    mode: 'index',
                    intersect: false
                }
            },
            hover: {
                mode: 'nearest',
                intersect: true
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Dias'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Milímetros (mm)'
                    }
                }
            }
        }
    });

    // Previsão para os próximos meses
    const previsaoMeses = 3; // Exemplo: previsão para os próximos 3 meses
    const previsaoPrecipitacao = [];
    const previsaoEvapotranspiracao = [];

    for (let i = 0; i < previsaoMeses; i++) {
        const precipitacaoMensal = precipitationAvg * 30; // Exemplo: precipitação média mensal
        const evapotranspiracaoMensal = etp * 30; // Exemplo: evapotranspiração média mensal
        previsaoPrecipitacao.push(precipitacaoMensal);
        previsaoEvapotranspiracao.push(evapotranspiracaoMensal);
    }

    // Exibir previsão em uma tabela
    document.getElementById('result').innerHTML += `
        <h3>Previsão para os próximos ${previsaoMeses} meses:</h3>
        <table>
            <tr>
                <th>Mês</th>
                <th>Precipitação (mm)</th>
                <th>Evapotranspiração (mm)</th>
            </tr>
            ${previsaoPrecipitacao.map((precipitacao, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${precipitacao.toFixed(2)}</td>
                    <td>${previsaoEvapotranspiracao[index].toFixed(2)}</td>
                </tr>
            `).join('')}
        </table>
    `;
}

// Função para calcular a evapotranspiração usando a fórmula de Hargreaves
function calcularEvapotranspiracao(mf, t, ur) {
    const ch = Math.min(0.158 * Math.sqrt(100 - ur), 1);
    const etp = mf * ((1.8 * t) + 32) * ch / 30;
    return etp;
}

// Função para calcular a média de um array de números
function calculateAverage(data) {
    const sum = data.reduce((acc, value) => acc + value, 0);
    return sum / data.length;
}

// Função para atualizar a barra de progresso
function updateProgressBar(percentage) {
    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = percentage + '%';
}
