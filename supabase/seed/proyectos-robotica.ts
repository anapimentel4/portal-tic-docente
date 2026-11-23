// Crea los 3 proyectos de robótica de ejemplo del plan (CLAUDE.md, fase 4).
//
//   pnpm seed:robotica:prueba   muestra qué se crearía (no toca la base de datos)
//   pnpm seed:robotica          los crea de verdad (necesita SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env)
//
// - Se crean publicados y sin foto; la foto se agrega después desde el portal (Editar proyecto).
// - Se puede ejecutar varias veces: no duplica los proyectos cuyo título ya existe.
// - Usa la service_role key (solo en .env, nunca en el frontend ni en git).

import { AREAS, GRADOS } from '../../packages/shared/src/catalogos.ts';

const SOLO_PRUEBA = process.argv.includes('--prueba');

// Un material o paso por línea: el portal los muestra como lista y numera los pasos.
const PROYECTOS = [
  {
    titulo: 'Semáforo inteligente',
    area: 'Matemática',
    grado: '1.º Secundaria',
    competencias: 'Pensamiento lógico, creativo y crítico; Resolución de problemas',
    materiales: [
      'Placa Arduino Uno y cable USB',
      'Protoboard',
      '3 LED: rojo, amarillo y verde',
      '3 resistencias de 220 Ω',
      'Cables de conexión macho-macho',
      'Computadora con Arduino IDE o mBlock',
    ].join('\n'),
    pasos: [
      'Observen un semáforo real y anoten cuántos segundos dura cada luz; calculen el tiempo total de un ciclo.',
      'Coloquen los 3 LED en la protoboard, cada uno con su resistencia, y conéctenlos a los pines 8, 9 y 10 del Arduino.',
      'Conecten el lado corto de cada LED a GND.',
      'Programen la secuencia verde → amarillo → rojo usando los tiempos medidos (en milisegundos).',
      'Prueben el semáforo y comprueben con un cronómetro que el ciclo dura lo calculado.',
      'Reto: cambien los tiempos para que la luz roja dure el doble que la verde y expliquen la proporción.',
    ].join('\n'),
  },
  {
    titulo: 'Estación meteorológica',
    area: 'Ciencias de la Naturaleza',
    grado: '3.º Secundaria',
    competencias: 'Indagación científica; Pensamiento lógico, creativo y crítico; Comunicativa',
    materiales: [
      'Placa Arduino Uno y cable USB',
      'Sensor de temperatura y humedad DHT11',
      'Pantalla LCD 16×2 con módulo I2C',
      'Protoboard y cables de conexión',
      'Computadora con Arduino IDE o mBlock',
    ].join('\n'),
    pasos: [
      'Formulen una pregunta: ¿cambian la temperatura y la humedad del aula durante el día?',
      'Conecten el sensor DHT11 al Arduino (VCC a 5V, GND a GND y datos al pin 2).',
      'Conecten la pantalla LCD por I2C (SDA a A4 y SCL a A5).',
      'Programen el Arduino para leer el sensor y mostrar los valores en la pantalla cada 5 segundos.',
      'Registren en una tabla la temperatura y la humedad a distintas horas durante una semana.',
      'Hagan una gráfica con los datos y comparen sus conclusiones con la pregunta inicial.',
    ].join('\n'),
  },
  {
    titulo: 'Maqueta de ciudad sostenible',
    area: 'Ciencias Sociales',
    grado: '2.º Secundaria',
    competencias: 'Ética y ciudadana; Ambiental y de la salud; Resolución de problemas',
    materiales: [
      'Placa Arduino Uno y cable USB',
      'Fotorresistencia (LDR) y resistencia de 10 kΩ',
      '4 LED blancos y 4 resistencias de 220 Ω (alumbrado público)',
      'Protoboard y cables de conexión',
      'Cartón, botellas y otros materiales reciclados para la maqueta',
    ].join('\n'),
    pasos: [
      'Investiguen un problema de su comunidad: consumo de energía, basura o transporte.',
      'Diseñen en papel una ciudad que responda a ese problema y repartan las tareas del equipo.',
      'Construyan la maqueta con materiales reciclados.',
      'Instalen los LED como alumbrado público y conecten la fotorresistencia al pin A0.',
      'Programen el Arduino para que las luces se enciendan solo cuando oscurece (ahorro de energía).',
      'Presenten la maqueta y expliquen cómo su ciudad cuida el ambiente y a sus habitantes.',
    ].join('\n'),
  },
].map((p) => ({ ...p, estado: 'publicado', foto_url: null }));

// Validar contra los catálogos (los mismos que exige la base de datos).
for (const p of PROYECTOS) {
  if (!(AREAS as readonly string[]).includes(p.area)) throw new Error(`Área fuera del catálogo: ${p.area}`);
  if (!(GRADOS as readonly string[]).includes(p.grado)) throw new Error(`Grado fuera del catálogo: ${p.grado}`);
}
console.log(`Proyectos de ejemplo: ${PROYECTOS.map((p) => p.titulo).join(', ')}.`);

if (SOLO_PRUEBA) {
  console.log('Modo prueba: no se guardó nada. Para crearlos: pnpm seed:robotica');
  process.exit(0);
}

const url = process.env.SUPABASE_URL;
const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !clave) {
  console.error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el archivo .env (copia .env.example).');
  process.exit(1);
}
const cabeceras = { apikey: clave, Authorization: `Bearer ${clave}`, 'Content-Type': 'application/json' };

// No duplicar: se saltan los títulos que ya existen.
const resp = await fetch(`${url}/rest/v1/proyectos_robotica?select=titulo`, { headers: cabeceras });
if (!resp.ok) {
  console.error(`No se pudo leer la tabla proyectos_robotica (${resp.status}): ${await resp.text()}`);
  process.exit(1);
}
const existentes = new Set(((await resp.json()) as { titulo: string }[]).map((p) => p.titulo));
const nuevos = PROYECTOS.filter((p) => !existentes.has(p.titulo));
console.log(`Ya estaban: ${PROYECTOS.length - nuevos.length}. Nuevos: ${nuevos.length}.`);

if (nuevos.length) {
  const ins = await fetch(`${url}/rest/v1/proyectos_robotica`, {
    method: 'POST',
    headers: { ...cabeceras, Prefer: 'return=minimal' },
    body: JSON.stringify(nuevos),
  });
  if (!ins.ok) {
    console.error(`No se pudieron guardar (${ins.status}): ${await ins.text()}`);
    process.exit(1);
  }
  console.log(`✓ Se crearon ${nuevos.length} proyectos.`);
}
