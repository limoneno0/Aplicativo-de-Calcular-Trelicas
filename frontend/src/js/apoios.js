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
    // Limpa as opções mantendo apenas o placeholder padrão
    selectNo.innerHTML = '<option value="" disabled selected>Selecionar Nó</option>';

    // Preenche o select com os nós existentes na sessão anterior
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

/* Função auxiliar de validação das regras dos apoios */
function validarApoiosEstrutura() {
    const qtdPino = listaApoios.filter(a => a.tipo === "Pino").length;
    const qtdRolete = listaApoios.filter(a => a.tipo === "Rolete").length;

    if (qtdPino !== 1 || qtdRolete !== 1) {
        return {
            valido: false,
            mensagem: `Configuração de apoios inválida! Para a estrutura ser calculada, é necessário ter 1 Apoio de Pino e 1 Apoio de Rolete.\nAtualmente você possui: ${qtdPino} Pino(s) e ${qtdRolete} Rolete(s).`
        };
    }
    return { valido: true };
}

/* eventos e logica */

/* bloqueio de navegação pelas tabs superiores */
linksNavegacao.forEach(link => {
    link.addEventListener('click', (e) => {
        // Ignora validação se estiver navegando de volta para abas anteriores já validadas
        if (link.getAttribute('href') === 'nos.html' || link.getAttribute('href') === 'barras.html') {
            return;
        }

        // Se tentar avançar para Cargas, valida a condição de apoios isostáticos
        if (!link.classList.contains('active')) {
            const validacao = validarApoiosEstrutura();
            if (!validacao.valido) {
                e.preventDefault();
                alert(validacao.mensagem);
            }
        }
    });
});

/* adicionar apoio */
btnAddApoio.addEventListener('click', (e) => {
    e.preventDefault();

    const tipo = selectTipo.value;
    const noSelecionado = parseInt(selectNo.value);
    const angulo = parseInt(selectAngulo.value);

    if (tipo && !isNaN(noSelecionado)) {
        
        // Regra 1: Não permitir mais de um apoio no mesmo nó
        const noJaTemApoio = listaApoios.some(a => a.no === noSelecionado);
        if (noJaTemApoio) {
            alert(`O Nó ${noSelecionado} já possui um apoio configurado.`);
            return;
        }

        // Regra 2: Evitar acumular desnecessariamente mais apoios do mesmo tipo antes de salvar
        const qtdMesmoTipo = listaApoios.filter(a => a.tipo === tipo).length;
        if (qtdMesmoTipo >= 1) {
            alert(`Você já adicionou um apoio do tipo ${tipo}. Remova o existente se deseja alterá-lo.`);
            return;
        }

        // Objeto do novo apoio
        const novoApoio = {
            id: listaApoios.length + 1,
            tipo: tipo,
            no: noSelecionado,
            angulo: angulo
        };

        listaApoios.push(novoApoio);

        /* salva no sessionStorage */
        sessionStorage.setItem("listaApoios", JSON.stringify(listaApoios));

        // Reseta os seletores para o padrão
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

/* validar acao do botao calcular */
btnCalcular.addEventListener('click', () => {
    const validacao = validarApoiosEstrutura();
    if (!validacao.valido) {
        alert(`Não é possível calcular: ${validacao.mensagem}`);
    } else {
        alert("Estrutura suportada corretamente (1 Pino e 1 Rolete). Pronta para o cálculo de reações!");
    }
});

/* inicialização ao abrir a pagina */
carregarOpcoesNos();
atualizarTabela();