/* inicializacao */
lucide.createIcons();

/* estado dos dados */
let listaNos = JSON.parse(sessionStorage.getItem("listaNos")) || [];
let listaBarras = JSON.parse(sessionStorage.getItem("listaBarras")) || [];
let listaApoios = JSON.parse(sessionStorage.getItem("listaApoios")) || [];

/* dom elementos */
const btnAddApoio = document.querySelector('.btn-add-apoios');
const selectTipo = document.getElementById('select-tipo');
const selectNo = document.getElementById('select-no');
const selectAngulo = document.getElementById('select-angulo');
const corpoTabela = document.getElementById('corpo-tabela-apoios');
const linksNavegacao = document.querySelectorAll('.nav-btn');
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

    listaApoios.forEach((apoio, index) => {
        const linha = `
            <tr>
                <td>${apoio.tipo}</td>
                <td>Nó ${apoio.no}</td>
                <td>${apoio.angulo}°</td>
                <td>
                    <button class="btn-action" onclick="removerApoio(${index})">
                        <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                    </button>
                </td>
            </tr>
        `;
        corpoTabela.innerHTML += linha;
    });

    lucide.createIcons();
}

function removerApoio(index) {
    listaApoios.splice(index, 1);

    /* atualiza o sessionStorage dos apoios */
    sessionStorage.setItem("listaApoios", JSON.stringify(listaApoios));

    atualizarTabela();

    try {
        if (typeof refresh === "function") refresh();
    } catch (erroCanvas) {
        console.warn("A função refresh() falhou ao redesenhar o canvas:", erroCanvas);
    }
}


/* eventos e logica */


/* adicionar apoio */
btnAddApoio.addEventListener('click', (e) => {
    e.preventDefault();

    const tipo = selectTipo.value;
    const noSelecionado = parseInt(selectNo.value);
    const anguloSelecionado = parseInt(selectAngulo.value);

    if (tipo && !isNaN(noSelecionado)) {
        
        // regra 1: não permitir mais de um apoio no mesmo nó
        const noJaTemApoio = listaApoios.some(a => a.no === noSelecionado);
        if (noJaTemApoio) {
            alert(`O Nó ${noSelecionado} já possui um apoio configurado.`);
            return;
        }

        // regra 2: evitar acumular mais apoios do mesmo tipo antes de salvar
        const qtdMesmoTipo = listaApoios.filter(a => a.tipo === tipo).length;
        if (qtdMesmoTipo >= 1) {
            alert(`Você já adicionou um apoio do tipo ${tipo}. Remova o existente se deseja alterá-lo.`);
            return;
        }

        // instanciacao utilizando as funcoes do back 
        let novoApoio;
        if (tipo === "Pino") {
            // O Pino recebe id e noId
            novoApoio = criarPino(listaApoios.length + 1, noSelecionado);
        } else if (tipo === "Rolete") {
            // mapeia o ângulo para a direção correspondente ('x' ou 'y')
            let forcaDir = 'y'; // padrão para 0 e 180
            if (anguloSelecionado === 90 || anguloSelecionado === 270) {
                forcaDir = 'x';
            }
            
            // o rolete recebe id, noId e a direção mapeada
            novoApoio = criarRolete(listaApoios.length + 1, noSelecionado, forcaDir);
        }

        novoApoio.tipo = tipo;
        novoApoio.no = novoApoio.noId; 
        novoApoio.angulo = anguloSelecionado; 

        listaApoios.push(novoApoio);

        // log no console
        console.log(`%c[Apoio Adicionado] Tipo: ${novoApoio.tipo} no Nó: ${novoApoio.no}`, "color: #17A2B8; font-weight: bold;");
        console.log(`Ângulo selecionado: ${novoApoio.angulo}°`);
        if (tipo === "Rolete") {
            console.log(`Direção de restrição do Rolete (Direção da força): ${novoApoio.direcao.toUpperCase()}`);
        } else {
            console.log(`Vínculo do Pino: Restringe X e Y simultaneamente.`);
        }
        console.log("Dados do objeto salvo:", novoApoio);

        /* salva no sessionStorage */
        sessionStorage.setItem("listaApoios", JSON.stringify(listaApoios));

        // reseta os seletores para o padrao
        selectTipo.selectedIndex = 0;
        selectNo.selectedIndex = 0;
        selectAngulo.selectedIndex = 0;

        atualizarTabela();

        // Atualização do Canvas se disponível
        try {
            if (typeof refresh === "function") refresh();
        } catch (erroCanvas) {
            console.warn("A função refresh() falhou ao desenhar no canvas, mas os dados foram salvos:", erroCanvas);
        }

    } else {
        alert("Por favor, selecione o Tipo de Apoio e o Nó de Localização.");
    }
});


/* validacao no botao calcular */
if (btnCalcular) {
    btnCalcular.addEventListener('click', () => {
        // puxa os dados de todas as abas armazenados na sessão
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