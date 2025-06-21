const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// carrega o arquivo .proto
const PROTO_PATH = path.join(__dirname, '..', 'alarme.proto'); // aponta para o .proto na pasta raiz
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});
const alarme_proto = grpc.loadPackageDefinition(packageDefinition).alarme;

const ID_DISPOSITIVO = "Alarme_Pasta_Segura_NodeJS";
const SAC_ADDRESS = 'localhost:50051';

// configuração do Detector de Intrusão
const PASTA_SEGURA = path.join(__dirname, 'pasta_segura');
if (!fs.existsSync(PASTA_SEGURA)) fs.mkdirSync(PASTA_SEGURA);

// cria o cliente gRPC
const client = new alarme_proto.ServicoDeAlarme(SAC_ADDRESS, grpc.credentials.createInsecure());

let alarmeArmado = false;
let statusStream = null;

function iniciarFluxoDeStatus() {
    // inicia a chamada do Cliente de Streaming
    statusStream = client.EnviarFluxoDeStatus((error, response) => {
        if (error) {
            console.error('[gRPC] Erro no fluxo de status:', error.message);
        } else {
            console.log('[gRPC] Confirmação do servidor ao fechar fluxo:', response.mensagem);
        }
    });

    // envia o status inicial
    enviarStatusAtual();
}

function enviarStatusAtual() {
    if (!statusStream) return;
    const estado = alarmeArmado ? 1 : 2; // 1 para ARMADO, 2 para DESARMADO
    console.log(`> Enviando status: ${alarmeArmado ? 'ARMADO' : 'DESARMADO'}`);
    statusStream.write({ id_dispositivo: ID_DISPOSITIVO, estado_atual: estado });
}

function notificarIntrusao() {
    console.log("!!! Enviando alerta de INTRUSÃO para o SAC !!!");
    const payload = {
        id_dispositivo: ID_DISPOSITIVO,
        timestamp_utc: Date.now()
    };
    client.NotificarIntrusao(payload, (err, response) => {
        if (err) return console.error('[gRPC] Erro ao notificar intrusão:', err.message);
        console.log('[gRPC] Confirmação do SAC:', response.mensagem);
    });
}

// Lógica do detector de arquivos
console.log(`[DETECTOR] Vigiando a pasta: ${PASTA_SEGURA}`);
const watcher = fs.watch(PASTA_SEGURA, (eventType, filename) => {
    if (filename && eventType === 'rename') {
        console.log(`[DETECTOR] Atividade detectada na pasta: arquivo '${filename}'.`);
        if (alarmeArmado) {
            notificarIntrusao();
            alarmeArmado = false; // desarma automaticamente
            enviarStatusAtual(); // envia novo status desarmado
        } else {
            console.log("[DETECTOR] Alarme desarmado. Atividade ignorada.");
        }
    }
});

// CLI interativa
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function promptCommand() {
    console.log("\n------------------------------------");
    console.log(`Alarme está: ${alarmeArmado ? 'ARMADO' : 'DESARMADO'}`);
    console.log("Comandos: 'armar', 'desarmar', 'sair'");
    rl.question('Digite um comando: ', (command) => {
        switch(command.trim().toLowerCase()) {
            case 'armar':
                if (!alarmeArmado) {
                    alarmeArmado = true;
                    console.log('Alarme armado. Monitorando a pasta segura...');
                    enviarStatusAtual();
                } else {
                    console.log('Alarme já está armado.');
                }
                break;
            case 'desarmar':
                if (alarmeArmado) {
                    alarmeArmado = false;
                    console.log('Alarme desarmado.');
                    enviarStatusAtual();
                } else {
                    console.log('Alarme já está desarmado.');
                }
                break;
            case 'sair':
                console.log('Desligando cliente...');
                if (statusStream) {
                    statusStream.end(); // finaliza o fluxo de status
                }
                watcher.close(); // para de vigiar a pasta
                rl.close();
                client.close(); // fecha a conexão gRPC
                return; // sai da função para não chamar o prompt novamente
            default:
                console.log(`Comando desconhecido: '${command}'`);
        }
        promptCommand();
    });
}

// Inicia o programa
console.log("Cliente Simulador de Alarme iniciado.");
iniciarFluxoDeStatus();
promptCommand();