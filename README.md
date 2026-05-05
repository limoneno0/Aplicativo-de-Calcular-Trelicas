<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Analisador de Treliças Planas</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 40px;
            line-height: 1.6;
        }
        h1, h2 {
            color: #2c3e50;
        }
        ul {
            margin-left: 20px;
        }
    </style>
</head>
<body>

    <h1>Analisador de Treliças Planas</h1>
    <p>
        Aplicação para análise de treliças planas que permite ao usuário definir nós, elementos, vínculos e forças,
        realizando o cálculo estrutural completo.
    </p>

    <h2>Funcionalidades</h2>
    <ul>
        <li>Definição da posição dos nós no plano</li>
        <li>Conexão entre nós para formar elementos estruturais</li>
        <li>Detecção de barras que se cruzam (erro de modelagem)</li>
        <li>Configuração de vínculos (pino, rolete, etc.)</li>
        <li>Aplicação de forças externas</li>
        <li>Cálculo das forças nos nós e apoios</li>
        <li>Identificação de elementos em <strong>tração</strong> ou <strong>compressão</strong></li>
        <li>Indicação de <strong>elementos com força zero</strong></li>
    </ul>

    <h2>Como usar</h2>
    <ol>
        <li>Insira as coordenadas dos nós</li>
        <li>Defina quais nós formam cada elemento</li>
        <li>Configure os vínculos da estrutura</li>
        <li>Aplique as forças externas</li>
        <li>Execute a análise para obter os resultados</li>
    </ol>

    <h2>Resultados</h2>
    <ul>
        <li>Forças nos nós e nos vínculos</li>
        <li>Classificação dos elementos (tração ou compressão)</li>
        <li>Identificação de elementos com força nula</li>
    </ul>

    <h2>Testes</h2>
    <p>
        O projeto inclui testes com usuários para validar a usabilidade e a precisão dos resultados.
    </p>

</body>
</html>