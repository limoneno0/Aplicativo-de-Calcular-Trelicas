///Resultados bascimanete confirma botão que funciona e cria os menus

(function () {

    //criacao do painel principal
    function criarPainel() {
        const existing = document.getElementById('painel-resultados');
        if (existing) return existing;

        const painel = document.createElement('div');
        painel.id = 'painel-resultados';
        painel.style.cssText = `
            display: none;
            position: absolute;
            top: 12px; right: 12px;
            width: 260px;
            max-height: calc(100% - 24px);
            overflow-y: auto;
            background: rgba(10, 15, 33, 0.95);
            border: 1px solid #2e3248;
            border-radius: 10px;
            padding: 16px;
            font-family: Inter, sans-serif;
            font-size: 12px;
            color: #a0a4b8;
            z-index: 10;
            box-sizing: border-box;
        `;

        const container = document.getElementById('truss-canvas-container');
        if (container) container.appendChild(painel);
        return painel;
    }

    function secao(titulo, cor) {
        return `<div style="
            font-size:10px;
            text-transform:uppercase;
            color:${cor};
            font-weight:600;
            margin: 12px 0 6px;
            padding-bottom: 4px;
            border-bottom: 1px solid #2e3248;
        ">${titulo}</div>`;
    }

    function linha(label, valor, cor) {
        return `<div style="display:flex;justify-content:space-between;padding:3px 0;">
            <span>${label}</span>
            <span style="color:${cor};font-weight:600;">${valor}</span>
        </div>`;
    }

    function corTipo(tipo) {
        if (tipo === 'TRAÇÃO')    return '#5c59f0';
        if (tipo === 'COMPRESSÃO') return '#e06d3b';
        return '#a0a4b8';
    }

    function exibirResultados(resultado) {
        const painel = criarPainel();

        if (resultado.erro) {
            painel.innerHTML = `
                <div style="color:#e06d3b;font-weight:600;margin-bottom:8px;">⚠ Erro no cálculo</div>
                <div style="color:#a0a4b8;font-size:11px;">${resultado.erro}</div>
            `;
            painel.style.display = 'block';
            return;
        }

        let html = `<div style="color:#fff;font-weight:600;font-size:13px;margin-bottom:4px;">
            Resultados
            <button onclick="document.getElementById('painel-resultados').style.display='none'"
                style="float:right;background:none;border:none;color:#a0a4b8;cursor:pointer;font-size:14px;line-height:1;">✕</button>
        </div>`;

        //forcas
        html += secao('Forças nos Elementos', '#7c78f5');
        for (const r of resultado.resultados) {
            const sinal = r.forca > 0 ? '+' : '';
            html += linha(
                `Barra ${r.noA}–${r.noB}`,
                `${sinal}${r.forca} N &nbsp;<span style="font-size:10px;color:${corTipo(r.tipo)}">${r.tipo}</span>`,
                '#fff'
            );
        }

        //reaçoes
        html += secao('Reações nos Apoios', '#17A2B8');
        for (const v of resultado.reacoes) {
            html += linha(`Nó ${v.noId} — Rx`, `${v.rx} N`, '#17A2B8');
            html += linha(`Nó ${v.noId} — Ry`, `${v.ry} N`, '#17A2B8');
        }

        

        painel.innerHTML = html;
        painel.style.display = 'block';
    }

    //esse é o tchan do botao calcular
    function conectarBotao() {
        const btn = document.querySelector('.btn-calculate');
        if (!btn) return;

       
        const novo = btn.cloneNode(true);
        btn.parentNode.replaceChild(novo, btn);

        novo.addEventListener('click', () => {
            const nos    = JSON.parse(sessionStorage.getItem('listaNos'))    || [];
            const barras = JSON.parse(sessionStorage.getItem('listaBarras')) || [];
            const apoios = JSON.parse(sessionStorage.getItem('listaApoios')) || [];
            const cargas = JSON.parse(sessionStorage.getItem('listaCargas')) || [];

            
            let erros = [];
            if (nos.length < 3)
                erros.push(`- Nós: mínimo 3 (possui ${nos.length}).`);

            if (nos.length >= 3) {
                const nec = 2 * nos.length - 3;
                if (barras.length < nec)
                    erros.push(`- Barras: faltam ${nec - barras.length}.`);
                else if (barras.length > nec)
                    erros.push(`- Barras: hiperestática (${barras.length} de ${nec}).`);
            }

            const qtdPino   = apoios.filter(a => a.tipo === 'Pino').length;
            const qtdRolete = apoios.filter(a => a.tipo === 'Rolete').length;
            if (qtdPino !== 1 || qtdRolete !== 1)
                erros.push(`- Apoios: requer 1 Pino e 1 Rolete.`);

            if (cargas.length < 1)
                erros.push('- Cargas: mínimo 1 força.');

            if (erros.length > 0) {
                alert('Não é possível calcular a treliça:\n\n' + erros.join('\n'));
                return;
            }

            
            const resultado = window.calcularTrelica(nos, barras, apoios, cargas);
            exibirResultados(resultado);

           
            if (typeof window.refresh === 'function') window.refresh();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', conectarBotao);
    } else {
        conectarBotao();
    }

})();

//Botao novo projeto
(function conectarNovoProjeto() {
    function init() {
        document.querySelectorAll('.btn-outline').forEach(btn => {
            if (btn.textContent.trim() === 'Novo Projeto') {
                btn.addEventListener('click', () => {
                    if (!confirm('Tem certeza? Todos os dados da treliça atual serão apagados.')) return;

                    sessionStorage.removeItem('listaNos');
                    sessionStorage.removeItem('listaBarras');
                    sessionStorage.removeItem('listaApoios');
                    sessionStorage.removeItem('listaCargas');

                    
                    const painel = document.getElementById('painel-resultados');
                    if (painel) painel.style.display = 'none';

               
                    if (typeof window.refresh === 'function') window.refresh();

                    
                    window.location.reload();
                });
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
