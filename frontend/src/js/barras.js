/* inicializacao */
lucide.createIcons();

/* estado dos dados */
/* Carrega os dados da sessão atual (zeram se fechar a aba ou der F5) */
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

/* bloqueio de navegação */
linksNavegacao.forEach(link => {
    link.addEventListener('click', (e) => {
        if (!link.classList.contains('active') && listaNos.length < 3) {
            e.preventDefault();
            alert("São necessários no mínimo 3 nós para prosseguir.");
            return;
        }

        const n = listaNos.length;
        const barrasNecessarias = 2 * n - 3;
        const barrasAtuais = listaBarras.length;

        if (!link.classList.contains('active') && barrasAtuais < barrasNecessarias) {
            e.preventDefault();
            const faltam = barrasNecessarias - barrasAtuais;
            alert(`Treliça incompleta, adicionar mais ${faltam} barra${faltam > 1 ? 's' : ''}.`);
        }
    });
});


/* adicionar barra */
btnAddBarra.addEventListener('click', (e) => {
    e.preventDefault();

    // Captura os valores selecionados nos selects
    const valOrigem = parseInt(selectOrigem.value);
    const valDestino = parseInt(selectDestino.value);

    console.log("Tentando adicionar barra de:", valOrigem, "para:", valDestino);

    if (!isNaN(valOrigem) && !isNaN(valDestino)) {

        if (valOrigem === valDestino) {
            alert("Uma barra não pode conectar um nó a ele mesmo.");
            return;
        }

        // Verifica se a barra já existe (seja de A para B ou de B para A)
        const barraExiste = listaBarras.some(
            b => (b.noA === valOrigem && b.noB === valDestino) ||
                 (b.noA === valDestino && b.noB === valOrigem)
        );

        if (barraExiste) {
            alert("Esta barra já foi adicionada.");
            return;
        }

        // Utiliza a estrutura do seu backend bases.js (id, noA, noB)
        const novaBarra = criarElemento(
            listaBarras.length + 1,
            valOrigem,
            valDestino
        );

        listaBarras.push(novaBarra);
        console.log("Lista de barras atual após o push:", listaBarras);

        /* salva as barras na sessão */
        sessionStorage.setItem("listaBarras", JSON.stringify(listaBarras));

        // Reseta os seletores para o estado inicial
        selectOrigem.selectedIndex = 0;
        selectDestino.selectedIndex = 0;

        atualizarTabela();

        // Evita que erros na função de renderização do canvas barrem a atualização da tabela
        try {
            if (typeof refresh === "function") {
                refresh();
            }
        } catch (erroCanvas) {
            console.warn("A função refresh() falhou ao desenhar no canvas, mas os dados da barra foram salvos:", erroCanvas);
        }

    } else {
        alert("Por favor, selecione os nós de Origem e Destino.");
    }
});


/* validar acao do botao calcular */
btnCalcular.addEventListener('click', () => {
    const n = listaNos.length;
    const barrasNecessarias = 2 * n - 3;
    const barrasAtuais = listaBarras.length;

    if (barrasAtuais < barrasNecessarias) {
        const faltam = barrasNecessarias - barrasAtuais;
        alert(`Não é possível calcular: Treliça incompleta. Adicione mais ${faltam} barra${faltam > 1 ? 's' : ''}.`);
    } else if (barrasAtuais > barrasNecessarias) {
        alert("Aviso: A treliça possui mais barras do que o necessário para ser isostática (hiperestática).");
    } else {
        alert("Estrutura isostática pronta para o cálculo!");
    }
});


/* inicialização ao abrir a pagina */
carregarOpcoesNos();
atualizarTabela();