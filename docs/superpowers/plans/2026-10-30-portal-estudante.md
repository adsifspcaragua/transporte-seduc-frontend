# Sincronização Laravel e Portal do Estudante

**Fonte de verdade:** rotas, requests, resources, serviços, modelos, migrations e testes do repositório `transporte-seduc-backend`.

**Escopo autorizado:** auditar primeiro e implementar diretamente as funcionalidades suportadas, sem aguardar uma rodada adicional de aprovação; não adicionar endpoints de autenticação paralelos, não modificar o backend e não habilitar operações que dependem de contratos inexistentes.

## Diagnóstico e decisões

- A autenticação existente é Sanctum por sessão, com login/senha e `/me`. O portal reutiliza esse fluxo e separa a navegação administrativa por papel.
- O papel estudante tem `presencas.registrar`; o middleware Laravel deriva o estudante de `estudantes.user_id`.
- APIs próprias existentes: viagens, presenças, tentativas/revisão e dispositivo. Não existe consulta própria de inscrição, documentos, recadastro, confirmação de linha/ponto ou edição do cadastro autenticado. As consultas públicas por CPF não comprovam identidade e não serão usadas pelo portal.
- O backend semeia o papel estudante, mas o request de usuários ainda aceita apenas os quatro papéis administrativos. O frontend permitirá associar contas de estudante já existentes; documentará o provisionamento como dependência do backend.
- Presença: QR fixo da van → resolução no servidor → desafio único → assinatura ECDSA P-256 por chave privada não exportável em IndexedDB → GPS real → confirmação no Laravel. A vinculação depende de aprovação administrativa.
- Leitura de QR usa câmera e `BarcodeDetector` quando disponível. Alternativa: câmera nativa do telefone abrindo a URL do QR ou informar essa URL. Nunca enviar tokens a decodificadores externos nem navegar para URLs escaneadas arbitrárias.
- Layout próprio mobile, controles globais, cache em memória já existente com validade de 60 segundos e isolamento por sessão.

## Execução

- [x] Auditar contratos e lacunas de autenticação/cadastro/documentos/recadastro.
- [x] Auditar protocolo QR, criptografia, geocerca, dispositivos e estados de falha.
- [x] Implementar gestão administrativa de transporte e presença em componentes próprios, protegidos por permissão.
- [x] Integrar associação de conta existente ao estudante e reconhecer o papel retornado pelo backend.
- [x] Implementar serviços/tipos do portal e armazenamento seguro de chaves, com testes de contratos e WebCrypto.
- [x] Implementar proteção, layout, dashboard, transporte, frequência/revisões, conta e dispositivo.
- [x] Implementar leitura e confirmação de presença com GPS, controle de câmera e prevenção de envios duplicados.
- [x] Revisar o acesso público e a navegação após login, mantendo o cadastro existente separado do portal autenticado.
- [x] Verificar testes do frontend, Biome dos arquivos alterados, TypeScript e build de produção. O conjunto Laravel dirigido encontrou duas falhas preexistentes, documentadas na entrega; não houve sessão real de navegador disponível para validação de câmera/GPS.
- [x] Consolidar matriz final de compatibilidade, implementações e dependências restantes.
