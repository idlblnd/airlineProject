import http from 'k6/http';
import { check, sleep } from 'k6';


const BASE_URL = 'https://airline-midterm-g7b4btgfguecbwat.francecentral-01.azurewebsites.net/api-docs'; 
const TOKEN = '';

export const options = {
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.05'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(95)'],
};

export default function () {
  const res = http.get(
    `${BASE_URL}/api/v1/tickets/passenger-list?flightId=1`,
    {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
    }
  );

  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  sleep(1);
}