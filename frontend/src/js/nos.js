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
const btnCalcular = document.querySelector('.btn-calculate'); // Adicionado para a validação centralizada


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

/* NAVEGAÇÃO LIVRE: Sem bloqueios ao clicar nas abas superiores */


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


/* VALIDACAO CENTRALIZADA NO BOTAO CALCULAR */
if (btnCalcular) {
    btnCalcular.addEventListener('click', () => {
        // Recupera os dados atualizados de todas as seções no momento do clique
        const nos = JSON.parse(sessionStorage.getItem("listaNos")) || [];
        const barras = JSON.parse(sessionStorage.getItem("listaBarras")) || [];
        const apoios = JSON.parse(sessionStorage.getItem("listaApoios")) || [];
        const cargas = JSON.parse(sessionStorage.getItem("listaCargas")) || [];

        let erros = [];

        // 1. Validação de Nós
        if (nos.length < 3) {
            erros.push(`- Nós: São necessários no mínimo 3 nós (atualmente possui ${nos.length}).`);
        }

        // 2. Validação de Barras (Isostática: b = 2n - 3) com fallback atualizado
        if (nos.length >= 3) {
            const barrasNecessarias = 2 * nos.length - 3;
            if (barras.length < barrasNecessarias) {
                const faltam = barrasNecessarias - barras.length;
                erros.push(`- Barras: Treliça incompleta. Faltam adicionar ${faltam} barra${faltam > 1 ? 's' : ''}.`);
            } else if (barras.length > barrasNecessarias) {
                erros.push(`- Barras: A treliça possui mais barras do que o necessário (${barras.length} de ${barrasNecessarias}), tornando-a hiperestática.`);
            }
        } else {
            // Agora aparece perfeitamente na tela dos Nós também!
            erros.push("- Barras: Não é possível determinar as barras necessárias até que haja pelo menos 3 nós criados.");
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

        // Exibição dos alertas ou sucesso
        if (erros.length > 0) {
            alert("Não é possível calcular a treliça. Corrija os seguintes problemas:\n\n" + erros.join("\n"));
        } else {
            alert("Estrutura perfeitamente consistente e isostática! Pronta para o cálculo.");
        }
    });
}


/* carregar tabela ao abrir a pagina */
atualizarTabela();