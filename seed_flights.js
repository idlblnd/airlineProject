require('dotenv').config();
const db = require('./src/config/db');

const dates = [];
for (let d = 1; d <= 30; d++) {
  const dt = new Date('2026-04-18');
  dt.setDate(dt.getDate() + d);
  dates.push(dt.toISOString().split('T')[0]);
}

const routes = [
  ['IST', 'ADB', 75],
  ['ADB', 'IST', 75],
  ['IST', 'ESB', 60],
  ['ESB', 'IST', 60],
  ['IST', 'AYT', 55],
  ['AYT', 'IST', 55],
  ['IST', 'SAW', 45],
  ['SAW', 'IST', 45],
];

const airlines = ['TK', 'PC', 'LH', 'XQ'];

const flightTime = (fn) => {
  let h = 0;
  for (let i = 0; i < fn.length; i++) h = (h * 31 + fn.charCodeAt(i)) & 0xffff;
  const hour = 6 + (h % 15);
  const min  = (h >> 4) % 4 * 15;
  return `${String(hour).padStart(2,'0')}:${String(min).padStart(2,'0')}:00`;
};

async function run() {
  let n = 0;
  let num = 700;
  for (const ds of dates) {
    for (const [from, to, dur] of routes) {
      for (const al of airlines) {
        const fn = al + num++;
        const cap = 60 + Math.floor(Math.random() * 120);
        const dep = flightTime(fn);
        try {
          await db.query(
            'INSERT INTO flights(flight_number, airport_from, airport_to, date_from, date_to, duration, capacity, departure_time) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [fn, from, to, ds, ds, dur, cap, dep]
          );
          n++;
        } catch (e) {
          // skip duplicates
        }
      }
    }
  }
  console.log('Flights added:', n);
  process.exit(0);
}

run().catch(e => { console.error(e.message); process.exit(1); });
