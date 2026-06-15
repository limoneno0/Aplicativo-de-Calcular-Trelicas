//Canvas para a tela
(function () {

    
    const COR_FUNDO        = '#171D38';
    const COR_GRADE        = '#2e3248';
    const COR_EIXO         = '#3a3f5c';
    const COR_BARRA        = '#7c78f5';
    const COR_NO           = '#5c59f0';
    const COR_NO_BORDA     = '#a09ef7';
    const COR_TEXTO        = '#ffffff';
    const COR_TEXTO_CINZA  = '#a0a4b8';
    const COR_APOIO_PINO   = '#17A2B8';
    const COR_APOIO_ROLETE = '#17A2B8';
    const COR_CARGA        = '#e06d3b';

    const RAIO_NO          = 8;
    const ESPACO_GRADE     = 60;   // px entre linhas da grade (em escala 1:1)
    const MARGEM           = 60;   // px de margem interna

    //Rendenizar camvas só para salvar as infos
    let canvas, ctx;
    let largura = 0, altura = 0;

    
    let escala   = 1;    // px por metro
    let offsetX  = 0;    // translação em px
    let offsetY  = 0;

    function init() {
        const container = document.getElementById('truss-canvas-container');
        if (!container) return;

        canvas = document.createElement('canvas');
        canvas.style.width  = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';
        container.appendChild(canvas);

        ctx = canvas.getContext('2d');

        ajustarTamanho();
        window.addEventListener('resize', () => { ajustarTamanho(); desenhar(); });

        desenhar();
    }

    function ajustarTamanho() {
        if (!canvas) return;
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width  = rect.width  || canvas.parentElement.offsetWidth;
        canvas.height = rect.height || canvas.parentElement.offsetHeight;
        largura = canvas.width;
        altura  = canvas.height;
    }

    //Leitura de dados
    function dados() {
        return {
            nos:    JSON.parse(sessionStorage.getItem('listaNos'))    || [],
            barras: JSON.parse(sessionStorage.getItem('listaBarras')) || [],
            apoios: JSON.parse(sessionStorage.getItem('listaApoios')) || [],
            cargas: JSON.parse(sessionStorage.getItem('listaCargas')) || [],
        };
    }

    //Calculo da transformação
    function calcularTransformacao(nos) {
        if (nos.length === 0) {
            escala  = ESPACO_GRADE;
            offsetX = largura  / 2;
            offsetY = altura   / 2;
            return;
        }

        const xs = nos.map(n => n.x);
        const ys = nos.map(n => n.y);
        const minX = Math.min(...xs), maxX = Math.max(...xs);
        const minY = Math.min(...ys), maxY = Math.max(...ys);

        const spanX = maxX - minX || 1;
        const spanY = maxY - minY || 1;

        const escX = (largura  - 2 * MARGEM) / spanX;
        const escY = (altura   - 2 * MARGEM) / spanY;
        escala = Math.min(escX, escY, 150);   

        //Usa isso para centralizar
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        offsetX = largura  / 2 - cx * escala;
        offsetY = altura   / 2 + cy * escala;  // Y invertido (tela: y cresce pra baixo)
    }

    /
    function tx(x) { return x * escala + offsetX; }
    function ty(y) { return -y * escala + offsetY; }   // inverte Y

    
    function desenhar() {
        if (!ctx) return;

        const { nos, barras, apoios, cargas } = dados();

        ctx.clearRect(0, 0, largura, altura);

        /* fundo */
        ctx.fillStyle = COR_FUNDO;
        ctx.fillRect(0, 0, largura, altura);

        calcularTransformacao(nos);

        desenharGrade();
        desenharEixos();

        if (nos.length === 0) {
            desenharMensagemVazia();
            return;
        }

        desenharBarras(nos, barras);
        desenharApoios(nos, apoios);
        desenharCargas(nos, cargas);
        desenharNos(nos);
    }

    
    function desenharGrade() {
        
        let passo = escala;                   // 1 m em px
        while (passo < 30) passo *= 2;
        while (passo > 120) passo /= 2;

        ctx.strokeStyle = COR_GRADE;
        ctx.lineWidth   = 0.5;

        const x0 = ((offsetX % passo) + passo) % passo;
        for (let x = x0; x < largura; x += passo) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, altura); ctx.stroke();
        }
        const y0 = ((offsetY % passo) + passo) % passo;
        for (let y = y0; y < altura; y += passo) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(largura, y); ctx.stroke();
        }
    }

    function desenharEixos() {
        ctx.strokeStyle = COR_EIXO;
        ctx.lineWidth   = 1;

        const yEixo = ty(0);
        if (yEixo >= 0 && yEixo <= altura) {
            ctx.beginPath(); ctx.moveTo(0, yEixo); ctx.lineTo(largura, yEixo); ctx.stroke();
        }
        const xEixo = tx(0);
        if (xEixo >= 0 && xEixo <= largura) {
            ctx.beginPath(); ctx.moveTo(xEixo, 0); ctx.lineTo(xEixo, altura); ctx.stroke();
        }
    }

    function desenharMensagemVazia() {
        ctx.fillStyle  = COR_TEXTO_CINZA;
        ctx.font       = '14px Inter, sans-serif';
        ctx.textAlign  = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Adicione nós para visualizar a treliça', largura / 2, altura / 2);
    }


    function desenharBarras(nos, barras) {
        const mapaNo = Object.fromEntries(nos.map(n => [n.id, n]));

        barras.forEach(b => {
            const nA = mapaNo[b.noA];
            const nB = mapaNo[b.noB];
            if (!nA || !nB) return;

            ctx.beginPath();
            ctx.moveTo(tx(nA.x), ty(nA.y));
            ctx.lineTo(tx(nB.x), ty(nB.y));
            ctx.strokeStyle = COR_BARRA;
            ctx.lineWidth   = 3;
            ctx.stroke();
        });
    }

   
    function desenharNos(nos) {
        nos.forEach(no => {
            const x = tx(no.x);
            const y = ty(no.y);

           
            ctx.beginPath();
            ctx.arc(x, y, RAIO_NO, 0, Math.PI * 2);
            ctx.fillStyle   = COR_NO;
            ctx.fill();
            ctx.strokeStyle = COR_NO_BORDA;
            ctx.lineWidth   = 2;
            ctx.stroke();

            
            ctx.fillStyle    = COR_TEXTO;
            ctx.font         = 'bold 11px Inter, sans-serif';
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(`N${no.id}`, x, y - RAIO_NO - 3);
        });
    }

    
    function desenharApoios(nos, apoios) {
        const mapaNo = Object.fromEntries(nos.map(n => [n.id, n]));
        const TAM = 18;

        apoios.forEach(apoio => {
            const no = mapaNo[apoio.no ?? apoio.noId];
            if (!no) return;

            const x = tx(no.x);
            const y = ty(no.y);
            const angRad = ((apoio.angulo ?? 0) * Math.PI) / 180;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angRad);        

            ctx.fillStyle   = COR_APOIO_PINO;
            ctx.strokeStyle = COR_APOIO_PINO;
            ctx.lineWidth   = 2;

            if (apoio.tipo === 'Pino') {
                
                ctx.beginPath();
                ctx.moveTo(0,    RAIO_NO);
                ctx.lineTo(-TAM, RAIO_NO + TAM * 1.4);
                ctx.lineTo( TAM, RAIO_NO + TAM * 1.4);
                ctx.closePath();
                ctx.fill();

                
                ctx.beginPath();
                ctx.moveTo(-TAM - 4, RAIO_NO + TAM * 1.4 + 4);
                ctx.lineTo( TAM + 4, RAIO_NO + TAM * 1.4 + 4);
                ctx.stroke();

            } else {
                
                ctx.beginPath();
                ctx.moveTo(0,    RAIO_NO);
                ctx.lineTo(-TAM, RAIO_NO + TAM * 1.4);
                ctx.lineTo( TAM, RAIO_NO + TAM * 1.4);
                ctx.closePath();
                ctx.stroke();

                
                for (let i = -1; i <= 1; i++) {
                    ctx.beginPath();
                    ctx.arc(i * (TAM * 0.6), RAIO_NO + TAM * 1.4 + 5, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            ctx.restore();
        });
    }

    
    function desenharCargas(nos, cargas) {
        const mapaNo = Object.fromEntries(nos.map(n => [n.id, n]));
        const COMP = 50;   
        const PONTA = 12;

        cargas.forEach(carga => {
            const no = mapaNo[carga.no ?? carga.noId];
            if (!no) return;

            const xNo = tx(no.x);
            const yNo = ty(no.y);

            
            const angRad = (carga.angulo * Math.PI) / 180;

            
            const xOrig = xNo - Math.cos(angRad) * COMP;
            const yOrig = yNo + Math.sin(angRad) * COMP;   

            ctx.strokeStyle = COR_CARGA;
            ctx.fillStyle   = COR_CARGA;
            ctx.lineWidth   = 2.5;

            ctx.beginPath();
            ctx.moveTo(xOrig, yOrig);
            ctx.lineTo(xNo - Math.cos(angRad) * RAIO_NO,
                       yNo + Math.sin(angRad) * RAIO_NO);
            ctx.stroke();

            const angPonta = Math.atan2(yNo - yOrig, xNo - xOrig);  
            ctx.beginPath();
            ctx.moveTo(xNo - Math.cos(angRad) * RAIO_NO,
                       yNo + Math.sin(angRad) * RAIO_NO);
            ctx.lineTo(
                xNo - Math.cos(angRad) * RAIO_NO - Math.cos(angPonta - 0.4) * PONTA,
                yNo + Math.sin(angRad) * RAIO_NO - Math.sin(angPonta - 0.4) * PONTA
            );
            ctx.lineTo(
                xNo - Math.cos(angRad) * RAIO_NO - Math.cos(angPonta + 0.4) * PONTA,
                yNo + Math.sin(angRad) * RAIO_NO - Math.sin(angPonta + 0.4) * PONTA
            );
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle    = COR_CARGA;
            ctx.font         = 'bold 11px Inter, sans-serif';
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'middle';
            const xLabel = xOrig - Math.cos(angRad) * 14;
            const yLabel = yOrig + Math.sin(angRad) * 14;
            ctx.fillText(`${carga.rotulo} (${carga.magnitude}N)`, xLabel, yLabel);
        });
    }

   
    window.refresh = function () {
        ajustarTamanho();
        desenhar();
    };

   
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
