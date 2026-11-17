/*
Painel de registro de atividades. Cada operação (adicionar, listar, editar, remover)
vira uma linha na tela com data/hora, ação e resultado
 */
(function (global) {
  'use strict';

  const LIMITE_DE_LINHAS = 100;
  const entradas = [];
  let container = null;

  /* Formata a data como dd/mm/aaaa hh:mm*/
  function formatarDataHora(data) {
    return data.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).replace(',', '');
  }

  // Monta uma linha usando textContent (nunca innerHTML), por segurança
  function criarLinha(entrada) {
    const linha = document.createElement('li');
    linha.className = 'registro__linha ' + (entrada.sucesso ? 'registro__linha--ok' : 'registro__linha--erro');

    const hora = document.createElement('time');
    hora.dateTime = entrada.data.toISOString();
    hora.textContent = formatarDataHora(entrada.data);

    const acao = document.createElement('strong');
    acao.textContent = entrada.acao;

    const resultado = document.createElement('span');
    resultado.textContent = entrada.resultado;

    linha.append(hora, ' — ', acao, ' — ', resultado);
    return linha;
  }

  function desenhar() {
    if (!container) return;
    container.replaceChildren();
    if (entradas.length === 0) {
      const vazio = document.createElement('li');
      vazio.className = 'registro__vazio';
      vazio.textContent = 'Nenhuma atividade ainda. Registre ou liste um relato para começar.';
      container.appendChild(vazio);
      return;
    }
    entradas.forEach(function (entrada) {
      container.appendChild(criarLinha(entrada));
    });
  }

  /* Indica em qual elemento (<ul> ou <ol>) o painel será desenhado */
  function iniciar(elemento) {
    container = elemento;
    desenhar();
  }

  /* Registra uma atividade e atualiza o painel */
  function registrar(acao, resultado, sucesso) {
    entradas.unshift({ data: new Date(), acao: acao, resultado: resultado, sucesso: sucesso !== false });
    if (entradas.length > LIMITE_DE_LINHAS) entradas.pop();
    desenhar();
  }

  global.Registro = { iniciar: iniciar, registrar: registrar, formatarDataHora: formatarDataHora };
})(window);
