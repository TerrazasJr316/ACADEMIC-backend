// load-tests/login-attack.js
import http from 'k6/http';
import { check, sleep } from 'k6';

// ⚙️ CONFIGURACIÓN DEL ESCENARIO
export const options = {
    // Definimos etapas para simular un ataque realista
    stages: [
        { duration: '10s', target: 10 }, // 1. Calentamiento: Subimos a 10 bots
        { duration: '30s', target: 50 }, // 2. Ataque: Mantenemos 50 bots golpeando a la vez
        { duration: '10s', target: 0 },  // 3. Enfriamiento: Bajamos a 0
    ],
    // 🚨 CRITERIOS DE FALLO (SLA)
    thresholds: {
        // Si el 95% de las peticiones tardan más de 500ms, la prueba reprueba
        http_req_duration: ['p(95)<500'],
        // Si más del 1% de las peticiones fallan, la prueba reprueba
        http_req_failed: ['rate<0.01'],
    },
};

export default function () {
    const url = 'http://localhost:3000/auth/login';

    // Datos del ataque (Intentamos entrar como un alumno)
    // Asegúrate de que este usuario exista o usa credenciales falsas para probar el rechazo
    const payload = JSON.stringify({
        email: 'alumno@test.com',
        password: 'password123',
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    // 👊 ¡GOLPE AL SERVIDOR!
    const res = http.post(url, payload, params);

    // 📝 VALIDACIÓN
    check(res, {
        // Aceptamos 200 (Login OK) o 401 (Credenciales mal), pero NO errores de servidor
        'status es 200 o 401': (r) => r.status === 200 || r.status === 401,
        'servidor sigue vivo (no 500)': (r) => r.status !== 500,
    });

    sleep(1); // Esperamos 1s entre golpes para no saturar tu propia PC
}