
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

module.exports = { criarNo, criarElemento, aplicaForca }
