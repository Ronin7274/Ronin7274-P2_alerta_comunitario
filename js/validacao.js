/*
 Valida e limpa toda entrada do usuário ANTES de ela ser usada
 Checa: campo vazio, tipo (precisa ser texto), tamanho, formato e lista de valores aceitos
 Depende de dados.js (usa as listas Dados.TIPOS e Dados.GRAVIDADES)
 */
(function (global) {
  'use strict';

  const BAIRRO_MIN = 3;
  const BAIRRO_MAX = 60;
  const DESCRICAO_MIN = 10;
  const DESCRICAO_MAX = 200;

  // Letras (com acento), números, espaço, apóstrofo e hífen.
  const FORMATO_BAIRRO = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9 '-]+$/;
  // Símbolos usados para injetar HTML. Bloqueados por segurança extra
  const SIMBOLOS_PROIBIDOS = /[<>]/;
  // Caracteres de controle (invisíveis), que não devem entrar nos textos
  const CARACTERES_CONTROLE = /[\u0000-\u001F\u007F]/g;

  /* Transforma qualquer valor em texto limpo: sem controle, sem espaços repetidos */
  function limparTexto(valor) {
    if (typeof valor !== 'string') {
      return '';
    }
    return valor.replace(CARACTERES_CONTROLE, ' ').replace(/\s+/g, ' ').trim();
  }

  function pertenceALista(valor, lista) {
    return Object.prototype.hasOwnProperty.call(lista, valor);
  }

  function validarTipo(tipo) {
    if (!tipo) return 'Escolha o tipo de relato.';
    if (!pertenceALista(tipo, Dados.TIPOS)) return 'Tipo de relato inválido.';
    return '';
  }

  function validarBairro(bairro) {
    if (!bairro) return 'Informe o bairro.';
    if (bairro.length < BAIRRO_MIN) return 'O bairro precisa ter pelo menos ' + BAIRRO_MIN + ' caracteres.';
    if (bairro.length > BAIRRO_MAX) return 'O bairro pode ter no máximo ' + BAIRRO_MAX + ' caracteres.';
    if (!FORMATO_BAIRRO.test(bairro)) return 'Use apenas letras, números, espaço, hífen e apóstrofo.';
    return '';
  }

  function validarGravidade(gravidade) {
    if (!gravidade) return 'Escolha a gravidade.';
    if (!pertenceALista(gravidade, Dados.GRAVIDADES)) return 'Gravidade inválida.';
    return '';
  }

  function validarDescricao(descricao) {
    if (!descricao) return 'Descreva o que está acontecendo.';
    if (descricao.length < DESCRICAO_MIN) return 'A descrição precisa ter pelo menos ' + DESCRICAO_MIN + ' caracteres.';
    if (descricao.length > DESCRICAO_MAX) return 'A descrição pode ter no máximo ' + DESCRICAO_MAX + ' caracteres.';
    if (SIMBOLOS_PROIBIDOS.test(descricao)) return 'Não use os símbolos < e > na descrição.';
    return '';
  }

  function validarPrivacidade(aceitou) {
    return aceitou === true ? '' : 'Marque a caixa para confirmar que leu o aviso de privacidade.';
  }

  /*
    Valida o formulário inteiro.
    Recebe { tipo, bairro, gravidade, descricao, privacidade } com valores crus
    Devolve { valido, erros, dados }:
    erros -> objeto { campo: mensagem } só com os campos que falharam
    dados -> valores já limpos, prontos para Dados.adicionar / Dados.editar
  */
  function validarFormulario(entrada) {
    const bruto = entrada || {};
    const dados = {
      tipo: limparTexto(bruto.tipo),
      bairro: limparTexto(bruto.bairro),
      gravidade: limparTexto(bruto.gravidade),
      descricao: limparTexto(bruto.descricao)
    };

    const erros = {};
    const resultados = {
      tipo: validarTipo(dados.tipo),
      bairro: validarBairro(dados.bairro),
      gravidade: validarGravidade(dados.gravidade),
      descricao: validarDescricao(dados.descricao),
      privacidade: validarPrivacidade(bruto.privacidade)
    };

    Object.keys(resultados).forEach(function (campo) {
      if (resultados[campo]) erros[campo] = resultados[campo];
    });

    return { valido: Object.keys(erros).length === 0, erros: erros, dados: dados };
  }

  global.Validacao = {
    DESCRICAO_MAX: DESCRICAO_MAX,
    limparTexto: limparTexto,
    validarFormulario: validarFormulario
  };
})(window);
