from concurrent import futures
import time
import grpc

# importa as classes geradas pelo Protoc
import alarme_pb2
import alarme_pb2_grpc

# mapeamento do enum para strings legíveis
ESTADO_MAP = {
    alarme_pb2.StatusAlarme.ARMADO: "ARMADO",
    alarme_pb2.StatusAlarme.DESARMADO: "DESARMADO",
    alarme_pb2.StatusAlarme.DESCONHECIDO: "DESCONHECIDO",
}

# implementação da classe de serviço definida no .proto
class ServicoDeAlarmeImpl(alarme_pb2_grpc.ServicoDeAlarmeServicer):

    def NotificarIntrusao(self, request, context):
        # notificação de intrusão (RPC Unário)
        timestamp = time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime(request.timestamp_utc / 1000))
        print(f"!!! ALERTA DE INTRUSÃO !!!")
        print(f"  > Dispositivo: {request.id_dispositivo}")
        print(f"  > Horário (UTC): {timestamp}")
        print("----------------------------------------")
        return alarme_pb2.Confirmacao(sucesso=True, mensagem="Alerta de intrusão recebido pelo SAC.")

    def EnviarFluxoDeStatus(self, request_iterator, context):
        # fluxo de atualizações de status (Streaming do Cliente)
        print("[STATUS] Cliente de fluxo de status conectado.")
        try:
            for status in request_iterator:
                estado_str = ESTADO_MAP.get(status.estado_atual, "INVALIDO")
                print(f"[STATUS] Recebido do dispositivo '{status.id_dispositivo}': {estado_str}")
        except grpc.RpcError as e:
            # O cliente desconectou
            print(f"[STATUS] Cliente de fluxo de status desconectado: {e.details()}")
        
        print("[STATUS] Fluxo de status do cliente encerrado.")
        return alarme_pb2.Confirmacao(sucesso=True, mensagem="SAC encerrou o recebimento de status.")

def serve():
    # inicia servidor gRPC e mantém rodando
    # cria servidor gRPC com pool de 10 threads para lidar com requisições
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    
    # adiciona a implementação do serviço ao servidor
    alarme_pb2_grpc.add_ServicoDeAlarmeServicer_to_server(ServicoDeAlarmeImpl(), server)
    
    # o servidor escuta em todas as interfaces de rede na porta 50051
    porta = '[::]:50051'
    server.add_insecure_port(porta)
    
    server.start()
    print(f"Servidor de Alarme Central (SAC) iniciado. Escutando na porta {porta}...")
    
    # mantém o servidor rodando infinitamente
    try:
        while True:
            time.sleep(86400) # dorme por um dia
    except KeyboardInterrupt:
        print("Desligando o servidor...")
        server.stop(0)

if __name__ == '__main__':
    serve()