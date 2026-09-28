# CodeQuest English

Aplicación web educativa (HTML/CSS/JS puro, sin frameworks ni build) para
aprender conceptos básicos de programación mientras se practica vocabulario
técnico en inglés, a través de 4 minijuegos interactivos con sistema de
puntos y progreso.

## Estructura del proyecto

```
codequest-english/
├── index.html   → estructura de la página (inicio + las 4 vistas de juego)
├── styles.css   → estilos (tema oscuro tipo editor de código, responsive)
└── script.js    → lógica de los juegos, puntuación y progreso guardado
```

Los tres archivos son autosuficientes: no hay dependencias externas más
allá de dos fuentes de Google Fonts (si no hay conexión a internet, cae
automáticamente en fuentes del sistema).

## Cómo ejecutarlo

No requiere instalación ni servidor:

1. Doble clic en `index.html` para abrirlo en cualquier navegador moderno
   (Chrome, Firefox, Edge), **o**
2. Opcionalmente, servirlo con la extensión "Live Server" de VS Code o con
   `npx serve` si prefieres verlo por `http://localhost`.

## Cómo publicarlo para evaluación

- **Netlify Drop**: arrastra la carpeta `codequest-english` completa a
  https://app.netlify.com/drop
- **GitHub Pages**: sube los 3 archivos a un repositorio y activa Pages
  desde la rama principal (carpeta raíz).

## Los 4 juegos

1. **Variable Vault** — empareja líneas de código con su tipo de dato
   (Number, String, Boolean, Array, Object). Refuerza: variable, declare,
   assign, value, data type.
2. **If/Else Island** — lee un fragmento de código y predice qué imprime
   (if / else / else if). Refuerza: condition, statement, comparison
   operator, boolean.
3. **Loop Runner** — predice cuántas veces corre un bucle o qué imprime
   (for / while). Un corredor avanza en pantalla con cada acierto.
   Refuerza: loop, iterate, iteration, increment, counter.
4. **Function Factory** — ordena las piezas de una función y luego predice
   su valor de retorno. Refuerza: function, parameter, argument, return,
   call.

Cada juego tiene un botón **📖 Vocabulary** con las definiciones en inglés,
y al terminar muestra un resumen de las palabras practicadas.

## Sistema de progreso

El puntaje de cada juego se guarda en el navegador (`localStorage`), así
que el progreso persiste entre sesiones. La pantalla de inicio muestra el
XP total, un "nivel" (Rookie Coder → Code Explorer → Code Ninja → Code
Master) y cuántos juegos se han completado. El botón "Reset progress" al
final de la página borra todo el avance guardado.

## Responsive

Diseño mobile-first con puntos de quiebre en 640px (tablet) y 1024px
(escritorio): la cuadrícula de juegos pasa de 1 a 2 y luego a 4 columnas,
y las columnas de emparejar (Variable Vault) se apilan en móvil y se ponen
lado a lado desde tablet en adelante.
