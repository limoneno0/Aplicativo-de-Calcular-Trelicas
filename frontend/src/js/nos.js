/* inicializacao */
lucide.createIcons();

/* estado dos dados */
/* Carrega os dados da sessão atual (zeram se fechar a aba ou der F5) */
let listaNos = JSON.parse(sessionStorage.getItem("listaNos")) || [];

/* dom elementos */
const btnAddNode = document.querySelector('.btn-add');
const inputX = document.querySelectorAll('input[type="number"]')[0];
const inputY = document.querySelectorAll('input[type="number"]')[1];
const corpoTabela = document.getElementById('corpo-tabela');
const linksNavegacao = document.querySelectorAll('.nav-btn');


/* funcoes da interface */

function atualizarTabela() {
    corpoTabela.innerHTML = '';

    listaNos.forEach((no, index) => {
        const linha = `
            <tr>
                <td>${index + 1}</td>
                <td>${no.x}</td>
                <td>${no.y}</td>
                <td>
                    <button class="btn-action" onclick="removerNo(${index})">
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


function removerNo(index) {
    console.log("Removendo o nó no índice:", index, "Dados do nó:", listaNos[index]);
    
    listaNos.splice(index, 1);

    /* atualiza os nós salvos na sessao atual */
    sessionStorage.setItem("listaNos", JSON.stringify(listaNos));
    console.log("Lista de nós após remoção:", listaNos);

    atualizarTabela();
}


/* eventos e logica */

/* bloqueio de navegação */
linksNavegacao.forEach(link => {
    link.addEventListener('click', (e) => {

        if (
            !link.classList.contains('active') &&
            listaNos.length < 3
        ) {
            e.preventDefault();

            alert(
                "São necessários no mínimo 3 nós para prosseguir."
            );
        }
    });
});


/* adicionar no */
btnAddNode.addEventListener('click', (e) => {
    e.preventDefault();

    const valX = parseFloat(inputX.value);
    const valY = parseFloat(inputY.value);

    // log pra ver o que foi digitado nos inputs
    console.log("Tentando adicionar nó nas coordenadas - X:", valX, "Y:", valY);

    if (!isNaN(valX) && !isNaN(valY)) {

        const noExiste = listaNos.some(
            no => no.x === valX && no.y === valY
        );

        if (noExiste) {
            alert(
                "Esse nó já existe, escolha outro."
            );
            return;
        }

        // uso da função criarNo vinda do bases.js
        const novoNo = criarNo(
            listaNos.length + 1,
            valX,
            valY
        );

        listaNos.push(novoNo);
        console.log("Lista de nós atual após o push:", listaNos);

        /* salva a lista de nós atualizada na sessão atual */
        sessionStorage.setItem("listaNos", JSON.stringify(listaNos));

        inputX.value = '';
        inputY.value = '';
        inputX.focus();

        atualizarTabela();

        // evita que falhas na atualização do canvas atrapalhem o fluxo da tabela de nos mas meio que nao serve pra nada ainda
        try {
            if (typeof refresh === "function") {
                refresh();
            }
        } catch (erroCanvas) {
            console.warn("A função refresh() falhou ao renderizar o nó no canvas, mas os dados foram salvos com sucesso:", erroCanvas);
        }

    } else {
        alert(
            "Por favor, insira valores válidos para X e Y."
        );
    }
});


/* carregar tabela ao abrir a pagina */
atualizarTabela();