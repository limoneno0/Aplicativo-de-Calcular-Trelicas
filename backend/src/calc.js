const { criarNo, criarElemento, aplicaForca, criarPino, criarRolete } = require('./bases')
const math = require('mathjs')

//NOTA NÃO É MAIS USADO POIS MATH NÃO RODA DIREITO

//Monta a matriz de rigidez global da treliça
function montarMatriz(nos, elementos) {
  const graus = nos.length * 2
  const K = math.zeros(graus, graus).toArray()

  for (const elem of elementos) {
    const dx = elem.noB.x - elem.noA.x
    const dy = elem.noB.y - elem.noA.y
    const L  = Math.sqrt(dx**2 + dy**2)
    const c  = dx / L
    const s  = dy / L
    //EA_L é aquele troço modulo de elasticidade vezes area por comprimento da barra
    //Ele já tem que receber um real
    //Por agora é o valor de elasticidade do AÇO
    //Com uma area muito pequena
    //const E = 200e9
    //const A = 0.0001
    
    //const EA_L = (E * A) / L
    
    //eU ODEIO ESSE TROÇO, por agora EA_Lvai ficar a 1 e
    //Não estamos simulando a realidade
    const EA_L = 1 / L

  ///SE ALGUÉM ME PERGUNTAR COMO ISSO FUNCIONA, EU SÓ PEGUEI DO MANO DO PYTHON
    const k = [
      [ c*c,  c*s, -c*c, -c*s],
      [ c*s,  s*s, -c*s, -s*s],
      [-c*c, -c*s,  c*c,  c*s],
      [-c*s, -s*s,  c*s,  s*s]
    ].map(row => row.map(v => v * EA_L))  // aplica EA/L

    const iA  = (elem.noA.id - 1) * 2
    const iB  = (elem.noB.id - 1) * 2
    const idx = [iA, iA+1, iB, iB+1]

    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 4; j++)
        K[idx[i]][idx[j]] += k[i][j]
  }

  return K
}

//Monta o vetor de forças externas convertendo magnitude e ângulo em X e Y
function montarVetorForcas(nos, forcas) {
  const F = Array(nos.length * 2).fill(0)

  for (const forca of forcas) {
    const rad  = forca.graus * Math.PI / 180
    const idx  = (forca.noId - 1) * 2
    F[idx]     += forca.magnitude * Math.cos(rad)
    F[idx + 1] += forca.magnitude * Math.sin(rad)
  }

  return F
}

//Remove os graus de liberdade travados pelos vínculos, isso nao funciona 100%
function aplicarVinculos(K, F, vinculos) {
  const travados = new Set()

  for (const vinculo of vinculos) {
    const idx = (vinculo.noId - 1) * 2
    if (vinculo.direcao === undefined) {
      travados.add(idx)
      travados.add(idx + 1)
    } else if (vinculo.direcao === 'x') {
      travados.add(idx)
    } else if (vinculo.direcao === 'y') {
      travados.add(idx + 1)
    }
  }

  const mapa  = [...Array(F.length).keys()].filter(i => !travados.has(i))
  const K_red = mapa.map(i => mapa.map(j => K[i][j]))
  const F_red = mapa.map(i => F[i])

  return { K_red, F_red, mapa }
}

//Reconstrói o vetor completo de deslocamentos com zeros nos nós travados
function reconstruirDeslocamentos(u_red, mapa, total) {
  const u = Array(total).fill(0)
  mapa.forEach((idx, i) => u[idx] = u_red[i][0])
  return u
}

//Calcula a força em cada elemento e classifica como tração, compressão ou zero
function calcularElementos(elementos, u) {
  return elementos.map(elem => {
    const dx = elem.noB.x - elem.noA.x
    const dy = elem.noB.y - elem.noA.y
    const L  = Math.sqrt(dx**2 + dy**2)
    const c  = dx / L
    const s  = dy / L

    const iA = (elem.noA.id - 1) * 2
    const iB = (elem.noB.id - 1) * 2

    const forca = (1 / L) * (
      c * (u[iB] - u[iA]) +
      s * (u[iB+1] - u[iA+1])
    )
    //NOTA DE VEZ ENQUANTO, A FORÇA ZERO DÁ COMO ALGO ALÉM DISSO
    //POR CAUSA DA TRAÇÃO, A SOLUÇÃO ATUAL MAIS ACEITÁVEL É
    //SÓ TACAR O FODASE E ARREDONDAR, PORQUE 0.0000012 PARA
    //TODO ENTENDIMENTO É IGUAL 0

    const forcaArred = parseFloat(forca.toFixed(4))

    return {
      elementoId: elem.id,
      forca: forcaArred,
      tipo: forcaArred > 0 ? 'TRAÇÃO' : forca < 0 ? 'COMPRESSÃO' : 'ZERO'
    }
  })
}

//Função principal — recebe a treliça completa e devolve os resultados
function calcularTrelica(nos, elementos, vinculos, forcas) {
  const K                      = montarMatriz(nos, elementos)
  const F                      = montarVetorForcas(nos, forcas)
  const { K_red, F_red, mapa } = aplicarVinculos(K, F, vinculos)

  console.log('mapa de graus livres:', mapa)
  console.log('tamanho K_red:', K_red.length)
  console.log('K_red:')
  console.table(K_red)
  console.log('determinante:')

  const det = math.det(K_red)

  console.log(det)

  if (Math.abs(det) < 1e-10) {
    return {
      erro: 'Estrutura instável. Verifique os apoios.',
      determinante: det
    }
  }

  const u_red      = math.lusolve(K_red, F_red)
  const u          = reconstruirDeslocamentos(u_red, mapa, nos.length * 2)
  const resultados = calcularElementos(elementos, u)

  return { resultados, u, K }  // agora retorna os três
}
  
//Calcula as reações nos vínculos multiplicando K completo pelo vetor de deslocamentos
function calcularReacoes(K, u, vinculos, nos) {
  const F_total = math.multiply(K, u)

  console.log('\n=== REAÇÕES NOS VÍNCULOS ===')
  for (const vinculo of vinculos) {
    const idx = (vinculo.noId - 1) * 2
    const rx  = F_total[idx]
    const ry  = F_total[idx + 1]
    console.log(`Nó ${vinculo.noId}: Rx=${rx.toFixed(4)}, Ry=${ry.toFixed(4)}`)
  }
}

//Printa todos os resultados da treliça
// Coleta todos os resultados em um objeto estruturado
//se chamará ela para o frontend também
function coletarResultados(nos, elementos, u, resultados, K, vinculos) {
  const F_total = math.multiply(K, u)

  const forcasElementos = resultados.map(r => ({
    elementoId: r.elementoId,
    forca: r.forca,
    unidade: 'N',
    tipo: r.tipo
  }))

  //É necessário?
  const deslocamentosNos = nos.map(no => {
    const idx = (no.id - 1) * 2
    return {
      noId: no.id,
      dx: parseFloat(u[idx].toFixed(4)),
      dy: parseFloat(u[idx+1].toFixed(4)),
      unidade: 'u'
    }
  })

  const reacoesVinculos = vinculos.map(vinculo => {
    const idx = (vinculo.noId - 1) * 2
    return {
      noId: vinculo.noId,
      rx: parseFloat(F_total[idx].toFixed(4)),
      ry: parseFloat(F_total[idx+1].toFixed(4)),
      unidade: 'N'
    }
  })

  return { forcasElementos, deslocamentosNos, reacoesVinculos }
}

// Imprime os resultados coletados, ela está assim para deixar mais fácil transferir para o front
function imprimirResultados(dados) {

  console.log('\n=== FORÇAS NOS ELEMENTOS ===')
  for (const r of dados.forcasElementos) {
    console.log(`Elemento ${r.elementoId}: ${r.forca} ${r.unidade} — ${r.tipo}`)
  }

  console.log('\n=== DESLOCAMENTOS NOS NÓS ===')
  for (const d of dados.deslocamentosNos) {
    console.log(`Nó ${d.noId}: dx=${d.dx} ${d.unidade}, dy=${d.dy} ${d.unidade}`)
  }

  console.log('\n=== REAÇÕES NOS VÍNCULOS ===')
  for (const v of dados.reacoesVinculos) {
    console.log(`Nó ${v.noId}: Rx=${v.rx} ${v.unidade}, Ry=${v.ry} ${v.unidade}`)
  }
}

///TESTES
const no1 = criarNo(1, 3, 0)
const no2 = criarNo(2, 6, 0)
const no3 = criarNo(3, 4.5, 2)
const no4 = criarNo(4, 2.5, 2)

const elem1 = criarElemento(1, no1, no2)
const elem2 = criarElemento(2, no1, no3)
const elem3 = criarElemento(3, no2, no3)

const elem4 = criarElemento(4, no1, no4)
const elem5 = criarElemento(5, no4, no3)

const pino1   = criarPino(1, no1.id)
//O y É O VÉRTICE QUE ELE PODE MOVER, honestamente por causa do mathjs ele só pode mover
//em Y, mas isso dai  talvez tenha que arrumar depois
//const rolete1 = criarRolete(1, no2.id, 'y')

//tetsando a criação com força em X, nesse ele dará o erro de instável
//const rolete1 = criarRolete(1, no2.id, 'x')
const rolete1 = criarRolete(1, no4.id, 'x')

const forca1 = aplicaForca(1, no3.id, 1000, 45)

const nos      = [no1, no2, no3, no4]
const elementos = [elem1, elem2, elem3, elem4, elem5]
const vinculos  = [pino1, rolete1]
const forcas    = [forca1]

//const { resultados, u, K } = calcularTrelica(nos, elementos, vinculos, forcas)
//const dados = coletarResultados(nos, elementos, u, resultados, K, vinculos)
const resultadoTrelica = calcularTrelica(nos,elementos,vinculos,forcas)

if (resultadoTrelica.erro) {
  console.log('\n=== ERRO ===')
  console.log(resultadoTrelica.erro)
  console.log('Determinante:', resultadoTrelica.determinante)
  process.exit(0)
}

const { resultados, u, K } = resultadoTrelica

const dados = coletarResultados(nos,elementos,u,resultados,K,vinculos)

imprimirResultados(dados)