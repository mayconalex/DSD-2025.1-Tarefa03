# Serviço de Alertas por Streaming com gRPC

![Slide 16_9 - 1](https://github.com/user-attachments/assets/a0e2b9a8-9336-48a7-af73-31cd718943d4)

Este projeto demonstra a implementação de um sistema monitoramento de pastas simples utilizando **gRPC** como framework de comunicação. A arquitetura é composta por um servidor em **Python** e um cliente em **Node.js**, ilustrando a interoperabilidade entre diferentes linguagens e plataformas.

O objetivo principal é demonstrar o uso prático do gRPC, incluindo a definição de um contrato de serviço com Protocol Buffers (Protobuf) e a implementação de diferentes padrões de chamada RPC (Unary e Client Streaming).

## Arquitetura e Funcionalidades

O sistema é dividido em dois componentes principais:

1.  **Servidor de Alerta (Python):**
    *   Implementa o serviço gRPC definido no arquivo `alarme.proto`;
    *   Escuta em uma porta de rede, esperando por chamadas remotas dos clientes;
    *   **Recebe e processa alertas de intrusão** através de uma chamada Unary RPC;
    *   **Recebe e processa um fluxo contínuo de status** ("ARMADO"/"DESARMADO") através de uma chamada Client Streaming RPC;
    *   Exibe todos os eventos recebidos em seu console.

2.  **Cliente (Node.js):**
    *   Simula um dispositivo de alarme;
    *   **Detector de Intrusão:** Monitora uma pasta local (`pasta_segura`). A criação de qualquer arquivo nesta pasta, enquanto o alarme está armado, é considerada uma intrusão;
    *   **Interface Interativa:** Permite que um usuário arme, desarme ou encerre o cliente através de comandos no terminal;
    *   **Comunicação gRPC:**
        *   Ao detectar uma intrusão, faz uma chamada **Unary RPC** (`NotificarIntrusao`) para o servidor;
        *   Mantém um **Client Streaming RPC** (`EnviarFluxoDeStatus`) aberto com o servidor para enviar atualizações de estado em tempo real sempre que o alarme é armado ou desarmado.

## Protocolos e Tecnologias

*   **Framework de Comunicação:** **gRPC**
*   **Definição de Interface (IDL):** **Protocol Buffers** (arquivo `.proto`)
*   **Transporte:** **HTTP/2** (gerenciado pelo gRPC)
*   **Linguagens:**
    *   Servidor: **Python**
    *   Cliente: **Node.js**

## Como Executar

**Pré-requisitos:**
*   Python 3 e Node.js instalados.
*   Ferramentas do `pip` (para Python) e `npm` (para Node.js) disponíveis no seu PATH.

**1. Configuração Inicial:**
*   Clone ou baixe o repositório;
*   Abra um terminal na pasta raiz do projeto.

**2. Gere o Código gRPC para Python:**
*   Primeiro, instale as ferramentas necessárias para o Python:
    ```bash
    pip install grpcio grpcio-tools
    ```
*   Em seguida, gere os arquivos base a partir do `.proto`:
    ```bash
    python -m grpc_tools.protoc -I. --python_out=. --grpc_python_out=. alarme.proto
    ```
    Isso criará os arquivos `alarme_pb2.py` e `alarme_pb2_grpc.py`.

**3. Instale as Dependências do Cliente Node.js:**
*   Navegue até a pasta do cliente:
    ```bash
    cd cliente
    ```
*   Instale os pacotes necessários:
    ```bash
    npm install
    ```
    *(Isso instalará `@grpc/grpc-js`, `@grpc/proto-loader` e `readline` a partir do arquivo `package.json`)*
*   Volte para a pasta raiz:
    ```bash
    cd ..
    ```

**4. Execute o Projeto:**
*   **Abra dois terminais** na pasta raiz do projeto.

*   **No Terminal 1 - Inicie o Servidor:**
    ```bash
    python servidor_sac.py
    ```
    O servidor começará a escutar na porta `50051`.

*   **No Terminal 2 - Inicie o Cliente:**
    ```bash
    # Navegue para a pasta do cliente primeiro
    cd cliente
    
    # Execute o cliente
    node cliente_alarme.js
    ```
    O cliente se conectará ao servidor e mostrará o prompt de comandos.

**5. Testando:**
*   Use os comandos `armar` e `desarmar` no terminal do cliente e observe os logs de status no console do servidor.
*   Com o alarme armado, crie um novo arquivo dentro da pasta `cliente/pasta_segura/`.
*   Observe o alerta de intrusão sendo enviado pelo cliente e recebido pelo servidor.
