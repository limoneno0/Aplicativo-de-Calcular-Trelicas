
//No caso o front pode também salvar esse ponto e só
//Mas quando estivermos conectando tudo, será
//melhor se o back e o front dividirem uma mesma
//lista de Nó e de Elemento

//Essa função salva um PONTO na trelissa
function criarNo(id, x, y) {
  return {
    id,
    x,
    y
  }
}

//Essa função salva um ELEMENTO na trelissa
//A ligação entre os dois
//Esse código não confirma se é possivel
function criarElemento(id, noA, noB) {
  return {
    id,
    noA,
    noB
  }
}


//Essa função salva uma força externa.
//Por agora salva só se tiver um ponto, mas futuramente vale
//a pena mudar para ser uma força distribuida e uma
//força que possa ser aplicada em qualquer lugar da
//treliça
function aplicaForca(id, noId, magnitude, graus) {
  return {
    id,
    noId,      
    magnitude,
    graus    
  }
}

//Pino: trava X e Y, mas permite rotação
function criarPino(id, noId) {
  return { id, noId }
}

//Rolete: trava só uma direção, permite mover na outra
//direção pode ser Y, não tem como rolar em X, certo??????
function criarRolete(id, noId, forcaDir) {
  return { id, noId, direcao: forcaDir }
}

module.exports = { criarNo, criarElemento, aplicaForca, criarPino, criarRolete }

/*
// Pino: Sempre trava X e Y (independe do ângulo)
function criarPino(id, noId, angulo) {
  return { 
    id, 
    noId, 
    tipo: 'Pino',
    angulo: angulo,
    reacaoX: true, 
    reacaoY: true 
  };
}

// Rolete: Restrição dinâmica calculada com base no ângulo
function criarRolete(id, noId, angulo) {
  // Se for 0 ou 180, reacaoX = false e reacaoY = true
  // Se for 90 ou 270, reacaoX = true e reacaoY = false
  const rx = (angulo === 90 || angulo === 270);
  const ry = (angulo === 0 || angulo === 180);

  return { 
    id, 
    noId, 
    tipo: 'Rolete',
    angulo: angulo,
    reacaoX: rx, 
    reacaoY: ry 
  };
}
*/