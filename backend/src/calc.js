const { criarNo, criarElemento, aplicaForca } = require('./bases')



///TESTES
const no1 = criarNo(1, 0, 0)
const no2 = criarNo(2, 3, 0)
const no3 = criarNo(3, 3, 3)
const no4 = criarNo(4, 0, 3)

const elem1 = criarElemento(1, no1, no2)
const elem2 = criarElemento(2, no3, no4)

const nos = [no1, no2, no3, no4]
for (const no of nos) {
  console.log(`Nó ${no.id}: x=${no.x}, y=${no.y}`)
}