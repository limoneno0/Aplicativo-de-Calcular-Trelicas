//Basicmanete a mesma LÓGICA que o calc, mas nesse não podemos usar o 
//math.h pois ele não roda direito e da dando rpoblemas
//

//Multiplica a matrix A com o vetor B
//basicmanete multiplica cada elemento da matriz e devolve
//o resultado dessas multiplicações
function matMul(A, b) {
    return A.map(row => row.reduce((s, v, j) => s + v * b[j], 0));
}


//luSolve é uma função nativa do math que vamos ter que fazer do zero
// Recebe a matriz de rigidez e o vetor de forças externas, e resolve o sistema Ax = b.
// Por baixo dos panos faz eliminação de Gauss para encontrar os deslocamentos.
// Retorna o vetor x com os deslocamentos de cada grau de liberdade.

function luSolve(A, b) {
    const n = b.length;
    const M = A.map((row, i) => [...row, b[i]]);   // matriz aumentada

    for (let col = 0; col < n; col++) {
        /* encontra o maior pivô na coluna */
        let maxRow = col;
        for (let row = col + 1; row < n; row++) {
            if (Math.abs(M[row][col]) > Math.abs(M[maxRow][col])) maxRow = row;
        }
        [M[col], M[maxRow]] = [M[maxRow], M[col]];

        if (Math.abs(M[col][col]) < 1e-12) throw new Error('Matriz singular');

        for (let row = col + 1; row < n; row++) {
            const f = M[row][col] / M[col][col];
            for (let k = col; k <= n; k++) M[row][k] -= f * M[col][k];
        }
    }

    //sem isso, a substituição regressiva, ele não retorna direito
    const x = Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
        x[i] = M[i][n];
        for (let j = i + 1; j < n; j++) x[i] -= M[i][j] * x[j];
        x[i] /= M[i][i];
    }
    return x;
}

// Recebe a matriz de rigidez reduzida e verifica se a estrutura é estável.
// Um determinante zero (ou perto disso) significa que a treliça é um mecanismo — não dá pra resolver.
// Retorna um número: se for ~0 a estrutura está mal configurada, se não for, pode calcular.

function determinante(A) {
    const n = A.length;
    const M = A.map(row => [...row]);
    let det = 1;

    for (let col = 0; col < n; col++) {
        let maxRow = col;
        for (let row = col + 1; row < n; row++) {
            if (Math.abs(M[row][col]) > Math.abs(M[maxRow][col])) maxRow = row;
        }
        if (maxRow !== col) { [M[col], M[maxRow]] = [M[maxRow], M[col]]; det *= -1; }

        if (Math.abs(M[col][col]) < 1e-12) return 0;
        det *= M[col][col];

        for (let row = col + 1; row < n; row++) {
            const f = M[row][col] / M[col][col];
            for (let k = col; k < n; k++) M[row][k] -= f * M[col][k];
        }
    }
    return det;
}


//Monta a matriz de rigidez global da treliça
function montarMatriz(nos, elementos) {
    const graus = nos.length * 2;
    const K = Array.from({ length: graus }, () => Array(graus).fill(0));

    for (const elem of elementos) {
        const nA = nos.find(n => n.id === elem.noA);
        const nB = nos.find(n => n.id === elem.noB);
        if (!nA || !nB) continue;

        const dx = nB.x - nA.x;
        const dy = nB.y - nA.y;
        const L  = Math.sqrt(dx ** 2 + dy ** 2);
        const c  = dx / L, s = dy / L;
        const EA_L = 1 / L;

        const k = [
            [ c*c,  c*s, -c*c, -c*s],
            [ c*s,  s*s, -c*s, -s*s],
            [-c*c, -c*s,  c*c,  c*s],
            [-c*s, -s*s,  c*s,  s*s],
        ].map(row => row.map(v => v * EA_L));

        const iA  = (nA.id - 1) * 2;
        const iB  = (nB.id - 1) * 2;
        const idx = [iA, iA + 1, iB, iB + 1];

        for (let i = 0; i < 4; i++)
            for (let j = 0; j < 4; j++)
                K[idx[i]][idx[j]] += k[i][j];
    }
    return K;
}

function montarVetorForcas(nos, forcas) {
    const F = Array(nos.length * 2).fill(0);
    for (const forca of forcas) {
        const rad = (forca.graus ?? forca.angulo) * Math.PI / 180;
        const idx = (forca.noId - 1) * 2;
        F[idx]     += forca.magnitude * Math.cos(rad);
        F[idx + 1] += forca.magnitude * Math.sin(rad);
    }
    return F;
}

function aplicarVinculos(K, F, vinculos) {
    const travados = new Set();
    for (const v of vinculos) {
        const idx = (v.noId - 1) * 2;
        if (v.direcao === undefined) {
            travados.add(idx); travados.add(idx + 1);
        } else if (v.direcao === 'x') {
            travados.add(idx);
        } else {
            travados.add(idx + 1);
        }
    }
    const mapa  = [...Array(F.length).keys()].filter(i => !travados.has(i));
    const K_red = mapa.map(i => mapa.map(j => K[i][j]));
    const F_red = mapa.map(i => F[i]);
    return { K_red, F_red, mapa };
}

function reconstruirDeslocamentos(u_red, mapa, total) {
    const u = Array(total).fill(0);
    mapa.forEach((idx, i) => u[idx] = u_red[i]);
    return u;
}

//calcular elementos é o antigo calcular restados, é um nome melhor
function calcularElementos(nos, elementos, u) {
    return elementos.map(elem => {
        const nA = nos.find(n => n.id === elem.noA);
        const nB = nos.find(n => n.id === elem.noB);
        if (!nA || !nB) return null;

        const dx = nB.x - nA.x;
        const dy = nB.y - nA.y;
        const L  = Math.sqrt(dx ** 2 + dy ** 2);
        const c  = dx / L, s = dy / L;

        const iA = (nA.id - 1) * 2;
        const iB = (nB.id - 1) * 2;

        const forca = (1 / L) * (
            c * (u[iB]   - u[iA]) +
            s * (u[iB+1] - u[iA+1])
        );
        const forcaArred = parseFloat(forca.toFixed(4));

        return {
            elementoId: elem.id,
            noA: elem.noA,
            noB: elem.noB,
            forca: forcaArred,
            tipo: forcaArred > 0 ? 'TRAÇÃO' : forcaArred < 0 ? 'COMPRESSÃO' : 'ZERO',
        };
    }).filter(Boolean);
}

window.calcularTrelica = function (nos, elementos, vinculos, forcas) {
    try {
        const K                      = montarMatriz(nos, elementos);
        const F                      = montarVetorForcas(nos, forcas);
        const { K_red, F_red, mapa } = aplicarVinculos(K, F, vinculos);

        const det = determinante(K_red);
        if (Math.abs(det) < 1e-10) {
            return { erro: 'Estrutura instável ou mecanismo. Verifique os apoios e a geometria.', determinante: det };
        }

        const u_red      = luSolve(K_red, F_red);
        const u          = reconstruirDeslocamentos(u_red, mapa, nos.length * 2);
        const resultados = calcularElementos(nos, elementos, u);

        /* reações nos vínculos: F_total = K × u */
        const F_total = matMul(K, u);
        const reacoes = vinculos.map(v => {
            const idx = (v.noId - 1) * 2;
            return {
                noId: v.noId,
                rx: parseFloat(F_total[idx].toFixed(4)),
                ry: parseFloat(F_total[idx + 1].toFixed(4)),
            };
        });

        const deslocamentos = nos.map(no => {
            const idx = (no.id - 1) * 2;
            return {
                noId: no.id,
                dx: parseFloat(u[idx].toFixed(6)),
                dy: parseFloat(u[idx + 1].toFixed(6)),
            };
        });

        return { resultados, deslocamentos, reacoes };

    } catch (e) {
        return { erro: e.message };
    }
};
