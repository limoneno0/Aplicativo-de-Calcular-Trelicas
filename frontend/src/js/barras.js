/* inicializacao */
lucide.createIcons();

/* estado dos dados */
/* carrega os dados da sesaoo atual (zeram se fechar a aba ou der F5) */
let listaNos = JSON.parse(sessionStorage.getItem("listaNos")) || [];
let listaBarras = JSON.parse(sessionStorage.getItem("listaBarras")) || [];

/* dom elementos */
const btnAddBarra = document.querySelector('.btn-add-barras');
const selectOrigem = document.getElementById('select-origem');
const selectDestino = document.getElementById('select-destino');
const corpoTabela = document.getElementById('corpo-tabela-barras');
const linksNavegacao = document.querySelectorAll('.nav-btn');
const btnCalcular = document.querySelector('.btn-calculate');


/* funcoes da interface */

function carregarOpcoesNos() {
    // Limpa as opções mantendo apenas o placeholder padrão
    selectOrigem.innerHTML = '<option value="" disabled selected>Selecionar Nó</option>';
    selectDestino.innerHTML = '<option value="" disabled selected>Selecionar Nó</option>';

    // Preenche os selects com os nós existentes na sessão
    listaNos.forEach((no) => {
        const opcao = `<option value="${no.id}">${no.id}</option>`;
        selectOrigem.innerHTML += opcao;
        selectDestino.innerHTML += opcao;
    });
}


function atualizarTabela() {
    corpoTabela.innerHTML = '';

    listaBarras.forEach((barra, index) => {
        const linha = `
            <tr>
                <td>${barra.noA}</td>
                <td>${barra.noB}</td>
                <td>
                    <button class="btn-action" onclick="removerBarra(${index})">
                        <i data-lucide="trash-2"
                           style="width: 14px; height: 14px;">
                        </i>
                    </button>
                </td>
            </tr>
        `;

        corpoTabela.innerHTML += linha;
    });

    lucide.createIcons();
}


function removerBarra(index) {
    listaBarras.splice(index, 1);

    /* atualiza o sessionStorage das barras */
    sessionStorage.setItem("listaBarras", JSON.stringify(listaBarras));

    atualizarTabela();
}


/* eventos e logica */

/* adicionar barra */
btnAddBarra.addEventListener('click', (e) => {
    e.preventDefault();

    // pega os valores selecionados nos selects
    const valOrigem = parseInt(selectOrigem.value);
    const valDestino = parseInt(selectDestino.value);

    console.log("Tentando adicionar barra de:", valOrigem, "para:", valDestino);

    if (!isNaN(valOrigem) && !isNaN(valDestino)) {

        if (valOrigem === valDestino) {
            alert("Uma barra não pode conectar um nó a ele mesmo.");
            return;
        }

        // verifica se a barra já existe (de A para B ou de B para A)
        const barraExiste = listaBarras.some(
            b => (b.noA === valOrigem && b.noB === valDestino) ||
                 (b.noA === valDestino && b.noB === valOrigem)
        );

        if (barraExiste) {
            alert("Esta barra já foi adicionada.");
            return;
        }

        // utiliza a funcao criarElemento do backend bases.js 
        const novaBarra = criarElemento(
            listaBarras.length + 1,
            valOrigem,
            valDestino
        );

        listaBarras.push(novaBarra);
        console.log("Lista de barras atual após o push:", listaBarras);

        /* salva as barras na sessão */
        sessionStorage.setItem("listaBarras", JSON.stringify(listaBarras));

        // reseta os seletores para o estado inicial
        selectOrigem.selectedIndex = 0;
        selectDestino.selectedIndex = 0;

        atualizarTabela();

        // mesma coisa do canvas que pode barrar a atualização da tabela
        try {
            if (typeof refresh === "function") {
                refresh();
            }
        } catch (erroCanvas) {
            console.warn("A função refresh() falhou ao desenhar no canvas, mas os dados foram salvos:", erroCanvas);
        }

    } else {
        alert("Por favor, selecione os nós de Origem e Destino.");
    }
});


/* VALIDACAO CENTRALIZADA NO BOTAO CALCULAR */
if (btnCalcular) {
    btnCalcular.addEventListener('click', () => {
        // Puxa os dados atualizados em tempo real de todas as coleções na sessão
        const nos = JSON.parse(sessionStorage.getItem("listaNos")) || [];
        const barras = JSON.parse(sessionStorage.getItem("listaBarras")) || [];
        const apoios = JSON.parse(sessionStorage.getItem("listaApoios")) || [];
        const cargas = JSON.parse(sessionStorage.getItem("listaCargas")) || [];

        let erros = [];

        // 1. Validação de Nós
        if (nos.length < 3) {
            erros.push(`- Nós: São necessários no mínimo 3 nós (atualmente possui ${nos.length}).`);
        }

        // 2. Validação de Barras (Isostática: b = 2n - 3) com fallback caso não haja nós suficientes
        if (nos.length >= 3) {
            const barrasNecessarias = 2 * nos.length - 3;
            if (barras.length < barrasNecessarias) {
                const faltam = barrasNecessarias - barras.length;
                erros.push(`- Barras: Treliça incompleta. Faltam adicionar ${faltam} barra${faltam > 1 ? 's' : ''}.`);
            } else if (barras.length > barrasNecessarias) {
                erros.push(`- Barras: A treliça possui mais barras do que o necessário (${barras.length} de ${barrasNecessarias}), tornando-a hiperestática.`);
            }
        } else {
            erros.push("- Barras: Não é possível definir as barras necessárias até que haja pelo menos 3 nós criados.");
        }

        // 3. Validação de Apoios (Exatamente 1 Pino e 1 Rolete)
        const qtdPino = apoios.filter(a => a.tipo === "Pino").length;
        const qtdRolete = apoios.filter(a => a.tipo === "Rolete").length;
        if (qtdPino !== 1 || qtdRolete !== 1) {
            erros.push(`- Apoios: Configuração inválida. Requer exatamente 1 Pino e 1 Rolete (atualmente possui ${qtdPino} Pino(s) e ${qtdRolete} Rolete(s)).`);
        }

        // 4. Validação de Forças/Cargas
        if (cargas.length < 1) {
            erros.push("- Cargas: É necessário configurar no mínimo 1 força na treliça para realizar o cálculo.");
        }

        // Exibição do veredito final
        if (erros.length > 0) {
            alert("Não é possível calcular a treliça. Corrija os seguintes problemas:\n\n" + erros.join("\n"));
        } else {
            alert("Estrutura perfeitamente consistente e isostática! Pronta para o cálculo.");
        }
    });
}


/* inicialização ao abrir a pagina */
carregarOpcoesNos();
atualizarTabela();