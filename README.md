# Controle de Paiol — Emulsão

<!-- Publicação Pages atualizada em 24/07/2026 -->
Aplicação estática para controle de estoque de emulsão por UMB e EBE, com lançamentos corrigíveis, dashboard operacional e armazenamento em Google Sheets via Apps Script.

## Estrutura da planilha

O Apps Script cria as abas `Lancamentos`, `Tanques`, `Usuarios` e `Auditoria`. A aba de lançamentos possui: `ID`, `Data do registro`, `Tipo de Lançamento`, `Tipo de Tanque`, `Tanque`, `Quantidade (kg)`, `Observação`, `Usuário`, `Atualizado em`, `Status`.

## Lançamento de saídas

Ao registrar `Saída`, o formulário mostra uma caixa de saldo final para cada tanque. O botão `Cheio`, ao lado de cada caixa, preenche automaticamente o maior saldo permitido para aquele tanque, usando a capacidade nominal como referência e respeitando o saldo atual quando ele for menor que a capacidade. Assim o fechamento não cria saldo final acima do disponível.

## Publicação

1. Abra a planilha indicada e acesse Extensões → Apps Script.
2. Cole `backend/Code.gs`, substitua o conteúdo e execute `setup` uma vez.
3. Implante como Web App: executar como você; acesso conforme a política da operação.
4. Copie a URL `/exec` para `config.js` em `apiUrl`.
5. Publique o conteúdo do repositório no GitHub Pages.

Sem URL de API, o sistema funciona em modo local para demonstração e deixa os registros no navegador. Com a URL configurada, a fonte oficial passa a ser a planilha.
