/* --- 1. INICIALIZAÇÃO --- */
lucide.createIcons();

/* --- 2. ESTADO DA APLICAÇÃO (DADOS) --- */
let listaNos = [];

/* --- 3. REFERÊNCIAS DO DOM (ELEMENTOS) --- */
const btnAddNode = document.querySelector('.btn-add');
const inputX = document.querySelectorAll('input[type="number"]')[0];
const inputY = document.querySelectorAll('input[type="number"]')[1];
const corpoTabela = document.getElementById('corpo-tabela');
const linksNavegacao = document.querySelectorAll('.nav-btn');

/* --- 4. FUNÇÕES DE INTERFACE --- */

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
                        <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                    </button>
                </td>
            </tr>
        `;
        corpoTabela.innerHTML += linha;
    });

    lucide.createIcons();
}

function removerNo(index) {
    listaNos.splice(index, 1);
    atualizarTabela();
}

/* --- 5. EVENTOS E LÓGICA --- */

// Bloqueio de Navegação
linksNavegacao.forEach(link => {
    link.addEventListener('click', (e) => {
        if (!link.classList.contains('active') && listaNos.length < 3) {
            e.preventDefault();
            alert("São necessários no mínimo 3 nós para prosseguir.");
        }
    });
});

// Adicionar Nó
btnAddNode.addEventListener('click', (e) => {
    e.preventDefault();

    const valX = parseFloat(inputX.value);
    const valY = parseFloat(inputY.value);

    if (!isNaN(valX) && !isNaN(valY)) {
        const noExiste = listaNos.some(no => no.x === valX && no.y === valY);

        if (noExiste) {
            alert("Esse nó já existe, escolha outro.");
            return;
        }

        const novoNo = criarNo(listaNos.length + 1, valX, valY); // <--- correção
        listaNos.push(novoNo);

        inputX.value = '';
        inputY.value = '';
        inputX.focus();

        atualizarTabela();

        if (typeof refresh === "function") refresh();

    } else {
        alert("Por favor, insira valores válidos para X e Y.");
    }
});