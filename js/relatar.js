/*
 Controla a página relatar.html: lê o formulário, valida, chama o CRUD
 de dados.js, atualiza a lista pelo DOM e escreve no painel de registro
 */
(function () {
  'use strict';

  // Única mensagem de erro técnico mostrada ao usuário (sem detalhes internos)
  const MENSAGEM_ERRO_GERAL = 'Não foi possível carregar os dados. Tente novamente.';
  const CAMPOS = ['tipo', 'bairro', 'gravidade', 'descricao', 'privacidade'];

  const el = {};            // guarda os elementos da página
  let idEmEdicao = null;    // id do relato que está sendo editado (ou null)
  let idParaRemover = null; // id aguardando confirmação de remoção
  let modalRemocao = null;  // instância do modal do Bootstrap (se disponível)

  /* ---------- Preparação ---------- */

  function capturarElementos() {
    el.form = document.getElementById('form-relatar');
    el.titulo = document.getElementById('titulo-formulario');
    el.botaoSalvar = document.getElementById('botao-salvar');
    el.botaoCancelar = document.getElementById('botao-cancelar');
    el.mensagem = document.getElementById('mensagem-geral');
    el.lista = document.getElementById('lista-relatos');
    el.contagem = document.getElementById('contagem-relatos');
    el.contador = document.getElementById('contador-descricao');
    el.botaoAtualizar = document.getElementById('botao-atualizar');
    el.botaoExemplos = document.getElementById('botao-exemplos');
    el.registro = document.getElementById('painel-registro');
    el.modal = document.getElementById('modal-remocao');
    el.confirmarRemocao = document.getElementById('botao-confirmar-remocao');
    CAMPOS.forEach(function (campo) {
      el[campo] = document.getElementById('campo-' + campo);
    });
  }

  /* ---------- Mensagens e erros na tela ---------- */

  /* Mostra um aviso no topo do formulário. tipo: 'success' ou 'danger' */
  function mostrarMensagem(texto, tipo) {
    el.mensagem.className = 'alert alert-' + tipo;
    el.mensagem.textContent = texto;
  }

  function esconderMensagem() {
    el.mensagem.className = 'alert d-none';
    el.mensagem.textContent = '';
  }

  function limparErroDoCampo(campo) {
    el[campo].classList.remove('is-invalid');
    const aviso = document.getElementById('erro-' + campo);
    if (aviso) aviso.textContent = '';
  }

  function limparErros() {
    CAMPOS.forEach(limparErroDoCampo);
  }

  /* Mostra, abaixo de cada campo inválido, a mensagem de erro */
  function mostrarErros(erros) {
    Object.keys(erros).forEach(function (campo) {
      el[campo].classList.add('is-invalid');
      document.getElementById('erro-' + campo).textContent = erros[campo];
    });
    const primeiro = CAMPOS.find(function (campo) { return erros[campo]; });
    if (primeiro) el[primeiro].focus();
  }

  /* ---------- Formulário ---------- */

  function lerFormulario() {
    return {
      tipo: el.tipo.value,
      bairro: el.bairro.value,
      gravidade: el.gravidade.value,
      descricao: el.descricao.value,
      privacidade: el.privacidade.checked
    };
  }

  function atualizarContador() {
    el.contador.textContent = el.descricao.value.length + '/' + Validacao.DESCRICAO_MAX;
  }

  function limparFormulario() {
    el.form.reset();
    limparErros();
    atualizarContador();
  }

  /* Deixa o formulário no modo "novo registro" */
  function sairDoModoEdicao() {
    idEmEdicao = null;
    el.titulo.textContent = 'Registrar relato';
    el.botaoSalvar.textContent = 'Registrar relato';
    el.botaoCancelar.classList.add('d-none');
  }

  /* Deixa o formulário no modo "editar" e preenche os campos */
  function entrarNoModoEdicao(item) {
    idEmEdicao = item.id;
    el.titulo.textContent = 'Editando o relato #' + item.id;
    el.botaoSalvar.textContent = 'Salvar alterações';
    el.botaoCancelar.classList.remove('d-none');
    el.tipo.value = item.tipo;
    el.bairro.value = item.bairro;
    el.gravidade.value = item.gravidade;
    el.descricao.value = item.descricao;
    limparErros();
    esconderMensagem();
    atualizarContador();
    el.tipo.focus();
  }

  /* ---------- Lista (DOM) ---------- */

  function classeDaGravidade(gravidade) {
    if (gravidade === 'alta') return 'text-bg-danger';
    if (gravidade === 'media') return 'text-bg-warning';
    return 'text-bg-info';
  }

  function criarBotao(texto, classe, aoClicar) {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'btn btn-sm ' + classe;
    botao.textContent = texto;
    botao.addEventListener('click', aoClicar);
    return botao;
  }

  /* Monta o cartão de um relato*/
  function criarCartao(item) {
    const li = document.createElement('li');
    li.className = 'relato';

    const selo = document.createElement('span');
    selo.className = 'badge ' + classeDaGravidade(item.gravidade);
    selo.textContent = 'Gravidade ' + Dados.GRAVIDADES[item.gravidade].toLowerCase();

    const titulo = document.createElement('h3');
    titulo.className = 'relato__titulo';
    titulo.textContent = Dados.TIPOS[item.tipo] + ' em ' + item.bairro;

    const texto = document.createElement('p');
    texto.className = 'relato__texto';
    texto.textContent = item.descricao;

    const data = document.createElement('p');
    data.className = 'relato__data';
    const foiEditada = item.atualizadoEm !== item.criadoEm;
    data.textContent = (foiEditada ? 'Atualizada em ' : 'Registrada em ') +
      Registro.formatarDataHora(new Date(foiEditada ? item.atualizadoEm : item.criadoEm));

    const acoes = document.createElement('div');
    acoes.className = 'relato__acoes';
    acoes.append(
      criarBotao('Editar', 'btn-outline-primary', function () { iniciarEdicao(item.id); }),
      criarBotao('Remover', 'btn-outline-danger', function () { pedirConfirmacaoDeRemocao(item.id); })
    );

    li.append(selo, titulo, texto, data, acoes);
    return li;
  }

  /* Desenha a lista inteira (mais nova primeiro). Devolve quantos itens existem */
  function desenharLista() {
    const itens = Dados.listar().reverse();
    el.lista.replaceChildren();

    if (itens.length === 0) {
      const vazio = document.createElement('li');
      vazio.className = 'relato__vazio';
      vazio.textContent = 'Nenhum relato registrado. Use o formulário para criar o primeiro.';
      el.lista.appendChild(vazio);
    } else {
      itens.forEach(function (item) { el.lista.appendChild(criarCartao(item)); });
    }

    el.contagem.textContent = itens.length === 1 ? '1 relato' : itens.length + ' relatos';
    return itens.length;
  }

  /* LISTAR: atualiza a tela e registra a operação no painel */
  function listarRelatos() {
    try {
      const total = desenharLista();
      Registro.registrar('Listar', total + ' item(ns) exibido(s) com sucesso', true);
    } catch (erro) {
      tratarErro('Listar', erro);
    }
  }

  /* ---------- Operações do CRUD ---------- */

  function tratarErro(acao, erro) {
    // O detalhe técnico fica só no console do desenvolvedor, nunca na tela
    console.error('[Cota de Alerta]', acao, erro);
    mostrarMensagem(MENSAGEM_ERRO_GERAL, 'danger');
    Registro.registrar(acao, 'Falha ao executar a operação', false);
  }

  function adicionarRelato(dados) {
    const item = Dados.adicionar(dados);
    desenharLista();
    mostrarMensagem('Relato registrado com sucesso.', 'success');
    Registro.registrar('Adicionar', 'Item #' + item.id + ' adicionado com sucesso', true);
  }

  function editarRelato(id, dados) {
    Dados.editar(id, dados);
    desenharLista();
    mostrarMensagem('Relato atualizado com sucesso.', 'success');
    Registro.registrar('Editar', 'Item #' + id + ' editado com sucesso', true);
  }

  function removerRelato(id) {
    try {
      Dados.remover(id);
      if (idEmEdicao === id) {
        sairDoModoEdicao();
        limparFormulario();
      }
      desenharLista();
      mostrarMensagem('Relato removido.', 'success');
      Registro.registrar('Remover', 'Item #' + id + ' removido com sucesso', true);
    } catch (erro) {
      tratarErro('Remover', erro);
    }
  }

  /* ---------- Eventos ---------- */

  function aoEnviarFormulario(evento) {
    evento.preventDefault();
    esconderMensagem();
    const acao = idEmEdicao === null ? 'Adicionar' : 'Editar';

    try {
      const resultado = Validacao.validarFormulario(lerFormulario());
      limparErros();

      if (!resultado.valido) {
        mostrarErros(resultado.erros);
        mostrarMensagem('Corrija os campos destacados e tente de novo.', 'danger');
        Registro.registrar(acao, 'Dados inválidos: operação não realizada', false);
        return;
      }

      if (idEmEdicao === null) {
        adicionarRelato(resultado.dados);
      } else {
        editarRelato(idEmEdicao, resultado.dados);
        sairDoModoEdicao();
      }
      limparFormulario();
    } catch (erro) {
      tratarErro(acao, erro);
    }
  }

  function iniciarEdicao(id) {
    try {
      const item = Dados.buscar(id);
      if (!item) throw new Error('ITEM_NAO_ENCONTRADO');
      entrarNoModoEdicao(item);
    } catch (erro) {
      tratarErro('Editar', erro);
    }
  }

  function aoCancelarEdicao() {
    sairDoModoEdicao();
    limparFormulario();
    esconderMensagem();
    Registro.registrar('Editar', 'Edição cancelada pelo usuário', true);
  }

  /* Pede confirmação antes de remover (modal do Bootstrap ou confirm() de reserva) */
  function pedirConfirmacaoDeRemocao(id) {
    idParaRemover = id;
    if (modalRemocao) {
      modalRemocao.show();
    } else if (window.confirm('Remover este relato?')) {
      removerRelato(id);
    }
  }

  function aoConfirmarRemocao() {
    if (idParaRemover !== null) removerRelato(idParaRemover);
    idParaRemover = null;
    if (modalRemocao) modalRemocao.hide();
  }

  /* Cria 3 relatos fictícios para testar a tela (passam pela mesma validação) */
  function carregarExemplos() {
    const exemplos = [
      { tipo: 'enchente', bairro: 'Vila Exemplo', gravidade: 'alta', descricao: 'Água subindo na rua principal e entrando em algumas casas.' },
      { tipo: 'deslizamento', bairro: 'Morro Fictício', gravidade: 'media', descricao: 'Rachaduras novas no barranco perto da escadaria.' },
      { tipo: 'onda-de-calor', bairro: 'Jardim Teste', gravidade: 'baixa', descricao: 'Praça sem sombra e sem água potável durante a tarde.' }
    ];
    try {
      exemplos.forEach(function (exemplo) {
        const resultado = Validacao.validarFormulario(Object.assign({ privacidade: true }, exemplo));
        if (resultado.valido) Dados.adicionar(resultado.dados);
      });
      desenharLista();
      Registro.registrar('Adicionar', '3 itens fictícios adicionados com sucesso', true);
    } catch (erro) {
      tratarErro('Adicionar', erro);
    }
  }

  function ligarEventos() {
    el.form.addEventListener('submit', aoEnviarFormulario);
    el.botaoCancelar.addEventListener('click', aoCancelarEdicao);
    el.botaoAtualizar.addEventListener('click', listarRelatos);
    el.botaoExemplos.addEventListener('click', carregarExemplos);
    el.confirmarRemocao.addEventListener('click', aoConfirmarRemocao);
    el.descricao.addEventListener('input', atualizarContador);
    // Ao digitar de novo em um campo, o erro dele some.
    CAMPOS.forEach(function (campo) {
      el[campo].addEventListener('input', function () { limparErroDoCampo(campo); });
      el[campo].addEventListener('change', function () { limparErroDoCampo(campo); });
    });
  }

  function iniciar() {
    capturarElementos();
    if (!el.form) return; // esta página não tem o formulário
    if (window.bootstrap && el.modal) modalRemocao = new window.bootstrap.Modal(el.modal);
    Registro.iniciar(el.registro);
    ligarEventos();
    atualizarContador();
    listarRelatos();
  }

  document.addEventListener('DOMContentLoaded', iniciar);
})();
