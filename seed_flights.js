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

async function run() {
  let n = 0;
  let num = 700;
  for (const ds of dates) {
    for (const [from, to, dur] of routes) {
      for (const al of airlines) {
        const fn = al + num++;
        const cap = 60 + Math.floor(Math.random() * 120);
        try {
          await db.query(
            'INSERT INTO flights(flight_number, airport_from, airport_to, date_from, date_to, duration, capacity) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [fn, from, to, ds, ds, dur, cap]
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
