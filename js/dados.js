/*
 Guarda os relatos em memória (um array) e oferece as quatro operações: 
 adicionar, listar, editar e remover
 Os dados somem ao recarregar a página
 */
(function (global) {
  'use strict';

  // Valores aceitos (lista fechada). A validação usa essas mesmas chaves
  const TIPOS = Object.freeze({
    'enchente': 'Enchente',
    'deslizamento': 'Deslizamento',
    'incendio': 'Incêndio',
    'onda-de-calor': 'Onda de calor',
    'obstrucao': 'Obstrução'
  });

  const GRAVIDADES = Object.freeze({
    'baixa': 'Baixa',
    'media': 'Média',
    'alta': 'Alta'
  });

  let relatos = [];
  let proximoId = 1;

  // Devolve uma cópia, para que quem chama não altere o array interno
  function copiar(item) {
    return Object.assign({}, item);
  }

  function encontrarIndice(id) {
    return relatos.findIndex(function (item) { return item.id === id; });
  }

  /* LISTAR: devolve cópias de todos os relatos, da mais antiga à mais nova */
  function listar() {
    return relatos.map(copiar);
  }

  /* Busca um relato pelo id. Devolve null se não existir */
  function buscar(id) {
    const indice = encontrarIndice(id);
    return indice === -1 ? null : copiar(relatos[indice]);
  }

  /* ADICIONAR: recebe dados já validados e cria o relato */
  function adicionar(dados) {
    const agora = new Date().toISOString();
    const item = {
      id: proximoId++,
      tipo: dados.tipo,
      bairro: dados.bairro,
      gravidade: dados.gravidade,
      descricao: dados.descricao,
      criadoEm: agora,
      atualizadoEm: agora
    };
    relatos.push(item);
    return copiar(item);
  }

  /* EDITAR: troca os campos de um relato existente */
  function editar(id, dados) {
    const indice = encontrarIndice(id);
    if (indice === -1) {
      throw new Error('ITEM_NAO_ENCONTRADO');
    }
    Object.assign(relatos[indice], {
      tipo: dados.tipo,
      bairro: dados.bairro,
      gravidade: dados.gravidade,
      descricao: dados.descricao,
      atualizadoEm: new Date().toISOString()
    });
    return copiar(relatos[indice]);
  }

  /* REMOVER: apaga o relato e devolve a cópia removida */
  function remover(id) {
    const indice = encontrarIndice(id);
    if (indice === -1) {
      throw new Error('ITEM_NAO_ENCONTRADO');
    }
    return copiar(relatos.splice(indice, 1)[0]);
  }

  global.Dados = { TIPOS, GRAVIDADES, listar, buscar, adicionar, editar, remover };
})(window);
