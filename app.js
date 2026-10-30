'use strict';

const cuentas = [
  { nombre: 'Mali', saldo: 200, password: '1234', dni: 44788834, movimientos: [] },
  { nombre: 'Gera', saldo: 150, password: '5678', dni: 10247439, movimientos: [] },
  { nombre: 'Sabi', saldo: 60, password: '9102', dni: 98005362, movimientos: [] }
];

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const pantallas = ['welcomeScreen', 'loginScreen', 'atmScreen'];
let cuentaSeleccionada = null;
let cuentaAutenticada = null;

function aCentimos(valor) {
  return Math.round(Number(valor) * 100);
}

function desdeCentimos(valor) {
  return valor / 100;
}

function formatoDinero(valor) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
    .format(valor)
    .replace('PEN', 'S/')
    .replace(/\s/g, ' ');
}

function formatoImporteCentimos(centimos) {
  return formatoDinero(desdeCentimos(centimos));
}

function mostrarPantalla(id) {
  pantallas.forEach((pantalla) => {
    const elemento = document.getElementById(pantalla);
    elemento.classList.toggle('hidden', pantalla !== id);
    elemento.classList.toggle('active', pantalla === id);
  });
  $('#siteFooter').classList.toggle('hidden', id === 'atmScreen');
}

function aviso(elemento, mensaje, tipo = 'error') {
  elemento.textContent = mensaje;
  elemento.className = `notice ${tipo}`;
}

function ocultarAviso(elemento) {
  elemento.textContent = '';
  elemento.className = 'notice hidden';
}

function dibujarCuentas() {
  const lista = $('#accountList');
  lista.innerHTML = '';
  cuentas.forEach((cuenta) => {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = `account-option${cuentaSeleccionada === cuenta ? ' selected' : ''}`;
    boton.setAttribute('aria-pressed', String(cuentaSeleccionada === cuenta));
    boton.innerHTML = `<span class="account-avatar">${cuenta.nombre.charAt(0)}</span><span class="account-details"><b>${cuenta.nombre}</b><small>DNI: ${cuenta.dni}</small></span><span class="account-balance protected-balance"><b>••••••</b><small>Saldo protegido</small></span><span class="chevron">›</span>`;
    boton.addEventListener('click', () => seleccionarCuenta(cuenta));
    lista.appendChild(boton);
  });
  $('#startButton').disabled = !cuentaSeleccionada;
}
function seleccionarCuenta(cuenta) {
  cuentaSeleccionada = cuenta;
  dibujarCuentas();
  ocultarAviso($('#welcomeMessage'));
}
function iniciarAutenticacion() {
  if (!cuentaSeleccionada) {
    aviso($('#welcomeMessage'), 'Selecciona una cuenta para continuar.');
    return;
  }
  $('#selectedName').textContent = cuentaSeleccionada.nombre;
  $('#selectedDni').textContent = `DNI: ${cuentaSeleccionada.dni}`;
  $('#passwordInput').value = '';
  ocultarAviso($('#loginMessage'));
  mostrarPantalla('loginScreen');
  $('#passwordInput').focus();
}
function autenticar(evento) {
  evento.preventDefault();
  const clave = $('#passwordInput').value.trim();
  if (!clave) {
    aviso($('#loginMessage'), 'Ingresa tu contraseña para continuar.');
    return;
  }
  if (!cuentaSeleccionada || clave !== cuentaSeleccionada.password) {
    aviso($('#loginMessage'), 'La contraseña es incorrecta. Verifica los datos e inténtalo nuevamente.');
    $('#passwordInput').select();
    return;
  }
  cuentaAutenticada = cuentaSeleccionada;
  $('#userInitial').textContent = cuentaAutenticada.nombre.charAt(0);
  $('#userName').textContent = cuentaAutenticada.nombre;
  $('#userDni').textContent = `DNI: ${cuentaAutenticada.dni}`;
  mostrarPantalla('atmScreen');
  renderizarOperacion('menu');
}
function actualizarFecha() {
  $('#currentDate').textContent = new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date());
}
function registrarMovimiento(tipo, importeCentimos) {
  cuentaAutenticada.movimientos.unshift({
    tipo,
    importeCentimos,
    saldoCentimos: aCentimos(cuentaAutenticada.saldo),
    fecha: new Date()
  });
}

function renderizarOperacion(tipo) {
  if (!cuentaAutenticada) {
    cerrarSesion();
    return;
  }
  actualizarFecha();
  ocultarAviso($('#globalMessage'));
  $$('.nav-item').forEach((boton) => {
    const activo = boton.dataset.operation === tipo;
    boton.classList.toggle('active', activo);
    if (activo) boton.setAttribute('aria-current', 'page');
    else boton.removeAttribute('aria-current');
  });
  const titulos = {
    menu: ['Resumen de tu cuenta', 'Selecciona una operación para continuar.'],
    balance: ['Consultar saldo', 'Este es el saldo disponible en tu cuenta.'],
    deposit: ['Ingresar dinero', 'Añade dinero a tu saldo disponible.'],
    withdraw: ['Retirar dinero', 'Retira dinero sin superar tu saldo disponible.'],
    movements: ['Últimos movimientos', 'Consulta las operaciones realizadas en esta sesión.']
  };
  $('#pageTitle').textContent = titulos[tipo][0];
  $('#pageSubtitle').textContent = titulos[tipo][1];
  const contenido = $('#operationContent');
  contenido.innerHTML = '';
  if (tipo === 'menu') contenido.appendChild(vistaResumen());
  if (tipo === 'balance') contenido.appendChild(vistaSaldo());
  if (tipo === 'deposit' || tipo === 'withdraw') contenido.appendChild(vistaFormularioImporte(tipo));
  if (tipo === 'movements') contenido.appendChild(vistaMovimientos());
}
function vistaResumen() {
  const contenedor = document.createElement('div');
  contenedor.innerHTML = `<div class="summary-grid"><section class="balance-card"><span class="card-label">Hola, ${cuentaAutenticada.nombre} · Saldo disponible</span><h2>${formatoDinero(cuentaAutenticada.saldo)}</h2><p>DNI: ${cuentaAutenticada.dni}</p><span class="balance-icon">▤</span></section><section class="quick-card"><h3>Selecciona una opción</h3><div class="quick-actions"><button class="quick-action" data-operation="balance"><span class="quick-icon">▣</span>Consultar saldo ›</button><button class="quick-action orange" data-operation="deposit"><span class="quick-icon">＋</span>Ingresar dinero ›</button><button class="quick-action" data-operation="withdraw"><span class="quick-icon">−</span>Retirar dinero ›</button><button class="quick-action" data-operation="movements"><span class="quick-icon">▤</span>Últimos movimientos ›</button></div></section></div><section class="quick-card recent-card"><div class="recent-heading"><h3>Últimos movimientos</h3><button class="link-button" data-operation="movements">Ver todos →</button></div><div id="recentMovements"></div></section>`;
  contenedor.querySelectorAll('[data-operation]').forEach((boton) => boton.addEventListener('click', () => renderizarOperacion(boton.dataset.operation)));
  const recientes = contenedor.querySelector('#recentMovements');
  if (!cuentaAutenticada.movimientos.length) recientes.innerHTML = '<div class="empty-state">Todavía no hay movimientos. Cuando realices un depósito o retiro aparecerá aquí.</div>';
  else recientes.appendChild(crearTablaMovimientos(cuentaAutenticada.movimientos.slice(0, 3)));
  return contenedor;
}
function vistaSaldo() {
  const contenedor = document.createElement('section');
  contenedor.className = 'balance-detail';
  contenedor.innerHTML = `<small>Saldo disponible · ${cuentaAutenticada.nombre}</small><h2>${formatoDinero(cuentaAutenticada.saldo)}</h2><p>Este es el importe disponible actualmente en tu cuenta.</p><button class="btn btn-primary" id="balanceBack">‹ Volver al menú</button>`;
  contenedor.querySelector('#balanceBack').addEventListener('click', () => renderizarOperacion('menu'));
  return contenedor;
}
function vistaFormularioImporte(tipo) {
  const deposito = tipo === 'deposit';
  const contenedor = document.createElement('section');
  contenedor.className = 'operation-card';
  contenedor.innerHTML = `<div class="operation-title"><span class="quick-icon ${deposito ? 'orange' : ''}">${deposito ? '＋' : '−'}</span><div><h2>${deposito ? 'Ingresar dinero' : 'Retirar dinero'}</h2><p>Saldo disponible: <b>${formatoDinero(cuentaAutenticada.saldo)}</b></p></div></div><form id="amountForm" novalidate><label class="amount-label" for="amountInput">Monto a ${deposito ? 'ingresar' : 'retirar'}</label><div class="amount-wrap"><input id="amountInput" type="text" inputmode="decimal" placeholder="0.00" autocomplete="off" aria-describedby="amountMessage"><span>S/</span></div><div class="presets">${(deposito ? [50, 100, 200, 500] : [20, 50, 100, 500]).map((monto) => `<button class="preset" type="button" data-amount="${monto}">S/ ${monto}</button>`).join('')}</div><div id="amountMessage" class="notice hidden" role="alert"></div><button class="btn btn-primary" type="submit">${deposito ? 'Ingresar dinero' : 'Retirar dinero'}　›</button></form><div id="operationResult"></div><button class="text-button" id="operationBack" type="button">Volver al menú principal</button>`;
  contenedor.querySelectorAll('[data-amount]').forEach((boton) => boton.addEventListener('click', () => { contenedor.querySelector('#amountInput').value = boton.dataset.amount; contenedor.querySelector('#amountInput').focus(); }));
  contenedor.querySelector('#amountForm').addEventListener('submit', (evento) => procesarImporte(evento, tipo, contenedor));
  contenedor.querySelector('#operationBack').addEventListener('click', () => renderizarOperacion('menu'));
  return contenedor;
}
function leerImporte(valor) {
  const limpio = valor.trim();
  if (!limpio || !/^(?:\d+)(?:[.,]\d{1,2})?$/.test(limpio)) return null;
  const normalizado = limpio.replace(',', '.');
  const numero = Number(normalizado);
  if (!Number.isFinite(numero) || numero <= 0) return null;
  const centimos = Math.round(numero * 100);
  if (!Number.isSafeInteger(centimos) || centimos <= 0) return null;
  return centimos;
}
function procesarImporte(evento, tipo, contenedor) {
  evento.preventDefault();
  if (!cuentaAutenticada) {
    cerrarSesion();
    return;
  }
  const campo = contenedor.querySelector('#amountInput');
  const mensaje = contenedor.querySelector('#amountMessage');
  const resultado = contenedor.querySelector('#operationResult');
  resultado.innerHTML = '';
  const importe = leerImporte(campo.value);
  if (importe === null) {
    aviso(mensaje, 'Ingresa un importe válido, mayor que S/ 0.00 y con máximo dos decimales.');
    campo.focus();
    return;
  }
  const saldoActual = aCentimos(cuentaAutenticada.saldo);
  if (tipo === 'withdraw' && importe > saldoActual) {
    aviso(mensaje, `Saldo insuficiente. Puedes retirar como máximo ${formatoImporteCentimos(saldoActual)}. No se realizó ningún cambio.`);
    return;
  }
  const nuevoSaldo = tipo === 'deposit' ? saldoActual + importe : saldoActual - importe;
  if (!Number.isSafeInteger(nuevoSaldo) || nuevoSaldo < 0) {
    aviso(mensaje, 'No se puede completar la operación porque el saldo resultante no es válido.');
    return;
  }
  cuentaAutenticada.saldo = desdeCentimos(nuevoSaldo);
  registrarMovimiento(tipo === 'deposit' ? 'Ingreso' : 'Retiro', importe);
  dibujarCuentas();
  ocultarAviso(mensaje);
  resultado.innerHTML = `<div class="operation-result"><span class="check">✓</span><div><b>¡Operación exitosa!</b><p>Has ${tipo === 'deposit' ? 'ingresado' : 'retirado'} ${formatoImporteCentimos(importe)}.</p><p>Nuevo saldo: <strong>${formatoDinero(cuentaAutenticada.saldo)}</strong></p></div></div>`;
  campo.value = '';
  contenedor.querySelector('.operation-title p').innerHTML = `Saldo disponible: <b>${formatoDinero(cuentaAutenticada.saldo)}</b>`;
}
function crearTablaMovimientos(movimientos) {
  const envoltura = document.createElement('div');
  envoltura.className = 'table-wrap';
  const filas = movimientos.map((movimiento) => `<tr><td>${new Intl.DateTimeFormat('es-PE', { dateStyle: 'short', timeStyle: 'short' }).format(movimiento.fecha)}</td><td class="${movimiento.tipo === 'Ingreso' ? 'type-deposit' : 'type-withdraw'}">${movimiento.tipo}</td><td>${formatoImporteCentimos(movimiento.importeCentimos)}</td><td><b>${formatoImporteCentimos(movimiento.saldoCentimos)}</b></td></tr>`).join('');
  envoltura.innerHTML = `<table><thead><tr><th>Fecha y hora</th><th>Tipo</th><th>Importe</th><th>Saldo</th></tr></thead><tbody>${filas}</tbody></table>`;
  return envoltura;
}
function vistaMovimientos() {
  const contenedor = document.createElement('section');
  contenedor.className = 'history-card';
  contenedor.innerHTML = '<h3>Historial de operaciones</h3><div id="historyContent"></div><button class="btn btn-primary" id="historyBack" style="margin-top:18px">‹ Volver al menú</button>';
  const destino = contenedor.querySelector('#historyContent');
  if (cuentaAutenticada.movimientos.length) destino.appendChild(crearTablaMovimientos(cuentaAutenticada.movimientos));
  else destino.innerHTML = '<div class="empty-state"><div class="empty-icon">▤</div><b>No hay movimientos todavía</b><p>Los depósitos y retiros que realices aparecerán aquí.</p></div>';
  contenedor.querySelector('#historyBack').addEventListener('click', () => renderizarOperacion('menu'));
  return contenedor;
}
function cerrarSesion() {
  cuentaAutenticada = null;
  cuentaSeleccionada = null;
  $('#passwordInput').value = '';
  ocultarAviso($('#loginMessage'));
  ocultarAviso($('#globalMessage'));
  $('#operationContent').innerHTML = '';
  dibujarCuentas();
  mostrarPantalla('welcomeScreen');
}

$('#startButton').addEventListener('click', iniciarAutenticacion);
$('#loginForm').addEventListener('submit', autenticar);
$('#togglePassword').addEventListener('click', () => {
  const campo = $('#passwordInput');
  const mostrar = campo.type === 'password';
  campo.type = mostrar ? 'text' : 'password';
  $('#togglePassword').setAttribute('aria-label', mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña');
});
$$('[data-go="welcomeScreen"]').forEach((boton) => boton.addEventListener('click', () => {
  $('#passwordInput').value = '';
  ocultarAviso($('#loginMessage'));
  mostrarPantalla('welcomeScreen');
}));
$$('.nav-item').forEach((boton) => boton.addEventListener('click', () => renderizarOperacion(boton.dataset.operation)));
$('#logoutButton').addEventListener('click', cerrarSesion);
$('#brandHome').addEventListener('click', (evento) => {
  evento.preventDefault();
  if (cuentaAutenticada) renderizarOperacion('menu');
  else mostrarPantalla('welcomeScreen');
});

dibujarCuentas();
