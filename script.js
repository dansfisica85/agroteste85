function calcular() {
    const cc = parseFloat(document.getElementById('cc').value);
    const pi = parseFloat(document.getElementById('pi').value);
    const apartirCicloCul = parseFloat(document.getElementById('apartirCicloCul').value);
    const ateCicloCul = parseFloat(document.getElementById('ateCicloCul').value) || apartirCicloCul;
    const mf = parseFloat(document.getElementById('mf').value);
    const t = parseFloat(document.getElementById('t').value);
    const ur = parseFloat(document.getElementById('ur').value);
    const pua = parseFloat(document.getElementById('pua').value);

    // Calcular evapotranspiração usando a fórmula de Hargreaves
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
        const precipitacaoDiaria = Math.random() * 10; // Exemplo: precipitação diária aleatória
        umidadeAtual += precipitacaoDiaria;
        umidadeAtual -= etp / 30; // Evapotranspiração diária
        precipitacaoTotal += precipitacaoDiaria;
        precipitacaoDiariaArray.push(precipitacaoDiaria);
        evapotranspiracaoDiariaArray.push(etp / 30);
    }

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
                    position: 'top'
                },
                tooltip: {
                    enabled: true
                }
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
}

// Função para calcular a evapotranspiração usando a fórmula de Hargreaves
function calcularEvapotranspiracao(mf, t, ur) {
    const ch = Math.min(0.158 * Math.sqrt(100 - ur), 1);
    const etp = mf * ((1.8 * t) + 32) * ch / 30;
    return etp;
}
