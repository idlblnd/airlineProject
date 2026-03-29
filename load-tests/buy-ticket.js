import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'https://airline-midterm-g7b4btgfguecbwat.francecentral-01.azurewebsites.net/api-docs'; 
const TOKEN = '';
export const options = {
  thresholds: {
    http_req_duration: ['p(95)<3000'], // 95% request 3sn altında
    http_req_failed: ['rate<0.05'],    // error %5'ten az
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(95)'],
};

export default function () {
  const payload = JSON.stringify({
    flightId: 1,
    passengerName: `User_${__VU}_${__ITER}`,
    passengerEmail: `user${__VU}${__ITER}@mail.com`,
    seatNumber: `C${(__ITER % 30) + 1}`, // çakışma azalt
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
  };

  const res = http.post(`${BASE_URL}/api/v1/tickets/buy`, payload, params);

  check(res, {
    'status is 200/201': (r) => r.status === 200 || r.status === 201,
  });

  sleep(1);
}