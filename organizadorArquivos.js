const fs = require('fs');
const path = require('path');
const os = require('os');
const { pathToFileURL } = require('url');
const EventEmitter = require('events');
const readline = require('readline');

class OrganizadorEventos extends EventEmitter {}
const organizador = new OrganizadorEventos();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

organizador.on('arquivoMovido', (arquivo, destino) => {
    console.log(`✔ Arquivo movido: ${arquivo} → ${destino}`);
});

organizador.on('erro', (err) => {
    console.error(`Erro: ${err.message}`);
});

function organizarArquivosPorExtensao(diretorio) {
    fs.readdir(diretorio, (err, arquivos) => {
        if (err) {
            organizador.emit('erro', err);
            rl.close();
            return;
        }
        if (arquivos.length === 0) {
            console.log(`Nenhum arquivo encontrado para organizar em: ${diretorio}`);
            rl.close();
            return;
        }
        let filesProcessed = 0;
        let totalFiles = 0;

        arquivos.forEach((arquivo) => {
            const caminhoCompleto = path.join(diretorio, arquivo);
            fs.stat(caminhoCompleto, (err, stats) => {
                if (err) {
                    organizador.emit('erro', err);
                    filesProcessed++;
                    if (filesProcessed === totalFiles) rl.close();
                    return;
                }
                if (stats.isFile()) {
                    totalFiles++;
                    const extensao = path.extname(arquivo).slice(1) || 'sem_extensao';
                    const pastaDestino = path.join(diretorio, extensao);
                    if (!fs.existsSync(pastaDestino)) {
                        fs.mkdirSync(pastaDestino);
                    }
                    const novoCaminho = path.join(pastaDestino, arquivo);
                    fs.rename(caminhoCompleto, novoCaminho, (err) => {
                        if (err) {
                            organizador.emit('erro', err);
                        }
                        organizador.emit('arquivoMovido', arquivo, pathToFileURL(novoCaminho).href);
                        filesProcessed++;
                        if (filesProcessed === totalFiles) rl.close();
                    });
                } else {
                    filesProcessed++;
                    if (filesProcessed === totalFiles) rl.close();
                }
            });
        });
        if (totalFiles === 0) {
            console.log(`Nenhum arquivo para mover em: ${diretorio}`);
            rl.close();
        }
    });
}

rl.question('Digite a pasta a ser organizada: ', (resposta) => {
    const pastaAlvo = path.resolve(resposta);

    if (!fs.existsSync(pastaAlvo)) {
        console.error(`Diretório não encontrado: ${pastaAlvo}`);
        rl.close();
        process.exit(1);
    }

    console.log(`Organizando arquivos na pasta: ${pastaAlvo}`);
    organizarArquivosPorExtensao(pastaAlvo);
});

