/* inicializacao */
lucide.createIcons();

/* estado dos dados */
let listaNos = JSON.parse(sessionStorage.getItem("listaNos")) || [];
let listaBarras = JSON.parse(sessionStorage.getItem("listaBarras")) || [];
let listaApoios = JSON.parse(sessionStorage.getItem("listaApoios")) || [];
let listaCargas = JSON.parse(sessionStorage.getItem("listaCargas")) || [];

/* dom elementos */
const btnAddCarga = document.querySelector('.btn-add-cargas');
const selectNo = document.getElementById('select-no');
const inputMagnitude = document.getElementById('input-magnitude');
const inputAngulo = document.getElementById('input-angulo');
const inputRotulo = document.getElementById('input-rotulo');
const corpoTabela = document.getElementById('corpo-tabela-cargas');
const btnCalcular = document.querySelector('.btn-calculate');

/* funcoes da interface */

function carregarOpcoesNos() {
    // limpa as opções mantendo apenas o placeholder padrão
    selectNo.innerHTML = '<option value="" disabled selected>Selecionar Nó</option>';

    // preenche o select com os nós existentes na sessão anterior
    listaNos.forEach((no) => {
        const opcao = `<option value="${no.id}">Nó ${no.id}</option>`;
        selectNo.innerHTML += opcao;
    });
}

function atualizarTabela() {
    corpoTabela.innerHTML = '';

    listaCargas.forEach((carga, index) => {
        const linha = `
            <tr>
                <td>${carga.rotulo}</td>
                <td>${carga.no}</td>
                <td>${carga.magnitude} N</td>
                <td>${carga.angulo}°</td>
                <td>
                    <button class="btn-action" onclick="removerCarga(${index})">
                        <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                    </button>
                </td>
            </tr>
        `;
        corpoTabela.innerHTML += linha;
    });

    lucide.createIcons();
}

function removerCarga(index) {
    listaCargas.splice(index, 1);

    /* atualiza o sessionStorage das cargas */
    sessionStorage.setItem("listaCargas", JSON.stringify(listaCargas));

    atualizarTabela();

    try {
        if (typeof refresh === "function") refresh();
    } catch (erroCanvas) {
        console.warn("A função refresh() falhou ao redesenhar o canvas:", erroCanvas);
    }
}

/* eventos e logica */

/* adicionar carga */
btnAddCarga.addEventListener('click', (e) => {
    e.preventDefault();

    const noSelecionado = parseInt(selectNo.value);
    const magnitude = parseFloat(inputMagnitude.value);
    const angulo = parseFloat(inputAngulo.value);
    const rotulo = inputRotulo.value.trim();

    // validação 1: seleção do no
    if (isNaN(noSelecionado)) {
        alert("Por favor, selecione o Nó de Aplicação.");
        return;
    }

    // validação 3: magnitude - apenas números positivos
    if (isNaN(magnitude) || magnitude <= 0) {
        alert("A magnitude da força deve ser um número positivo maior que zero.");
        return;
    }

    // Validação 4: angulo - apenas valores entre 0 e 360
    if (isNaN(angulo) || angulo < 0 || angulo > 360) {
        alert("O ângulo de aplicação deve conter um valor de 0 a 360 graus.");
        return;
    }

    // Validação 5: rótulo - deve começar com uma letra, seguido por letras ou números
    const regexValidaRotulo = /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9]*$/;
    if (!regexValidaRotulo.test(rotulo)) {
        alert("O rótulo da força deve começar obrigatoriamente com uma letra e conter apenas letras e números.");
        return;
    }

    // Validação 6: impedir rótulos com nomes exatamente iguais (permite p e P por exemplo)
    const rotuloJaExiste = listaCargas.some(c => c.rotulo === rotulo);
    if (rotuloJaExiste) {
        alert(`O rótulo "${rotulo}" já está sendo usado em outra força. Escolha um nome diferente.`);
        return;
    }

    // estruturação do objeto da força 
    const novaCarga = {
        id: listaCargas.length + 1,
        no: noSelecionado,
        noId: noSelecionado,      // Propriedade mapeada para o back-end
        magnitude: magnitude,
        angulo: angulo,
        graus: angulo,            // Propriedade mapeada para o back-end
        rotulo: rotulo
    };

    listaCargas.push(novaCarga);

    // log no console atualizado com os novos parâmetros adicionais
    console.log(`%c[Força Adicionada] Rótulo: ${novaCarga.rotulo} no Nó: ${novaCarga.no} (noId: ${novaCarga.noId})`, "color: #2E7D32; font-weight: bold;");
    console.log(`Intensidade: ${novaCarga.magnitude} N | Inclinação angular: ${novaCarga.angulo}° (graus: ${novaCarga.graus}°)`);
    console.log("Lista de forças salva no sessionStorage:", listaCargas);

    /* salva no sessionStorage */
    sessionStorage.setItem("listaCargas", JSON.stringify(listaCargas));

    // reseta os campos para o padrão inicial
    selectNo.selectedIndex = 0;
    inputMagnitude.value = '';
    inputAngulo.value = '';
    inputRotulo.value = '';

    atualizarTabela();

    // Atualização do Canvas se disponível
    try {
        if (typeof refresh === "function") refresh();
    } catch (erroCanvas) {
        console.warn("A função refresh() falhou ao desenhar no canvas, mas os dados foram salvos:", erroCanvas);
    }
});

/* validacao unificada no botao calcular */
if (btnCalcular) {
    btnCalcular.addEventListener('click', () => {
        const nos = JSON.parse(sessionStorage.getItem("listaNos")) || [];
        const barras = JSON.parse(sessionStorage.getItem("listaBarras")) || [];
        const apoios = JSON.parse(sessionStorage.getItem("listaApoios")) || [];
        const cargas = JSON.parse(sessionStorage.getItem("listaCargas")) || [];

        let erros = [];

        // 1. validação de nós
        if (nos.length < 3) {
            erros.push(`- Nós: São necessários no mínimo 3 nós (atualmente possui ${nos.length}).`);
        }

        // 2. validação de barras (b = 2n - 3)
        if (nos.length >= 3) {
            const barrasNecessarias = 2 * nos.length - 3;
            if (barras.length < barrasNecessarias) {
                const faltam = barrasNecessarias - barras.length;
                erros.push(`- Barras: Treliça incompleta. Faltam adicionar ${faltam} barra${faltam > 1 ? 's' : ''}.`);
            } else if (barras.length > barrasNecessarias) {
                erros.push(`- Barras: A treliça possui mais barras do que o necessário (${barras.length} de ${barrasNecessarias}), tornando-a hiperestática.`);
            }
        } else {
            erros.push("- Barras: Não é possível determinar as barras necessárias até que haja pelo menos 3 nós criados.");
        }

        // 3. validação de apoios (1 Pino e 1 Rolete)
        const qtdPino = apoios.filter(a => a.tipo === "Pino").length;
        const qtdRolete = apoios.filter(a => a.tipo === "Rolete").length;
        if (qtdPino !== 1 || qtdRolete !== 1) {
            erros.push(`- Apoios: Configuração inválida. Requer 1 Pino e 1 Rolete (atualmente possui ${qtdPino} Pino(s) e ${qtdRolete} Rolete(s)).`);
        }

        // 4. validação de forças/cargas
        if (cargas.length < 1) {
            erros.push("- Cargas: É necessário configurar no mínimo 1 força na treliça para realizar o cálculo.");
        }

        // exibição dos alertas acumulados ou sucesso
        if (erros.length > 0) {
            alert("Não é possível calcular a treliça. Corrija os seguintes problemas:\n\n" + erros.join("\n"));
        } else {
            alert("Estrutura pronta para o cálculo!");
        }
    });
}

/* inicialização ao abrir a pagina */
carregarOpcoesNos();
atualizarTabela();