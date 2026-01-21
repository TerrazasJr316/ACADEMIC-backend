import http from 'k6/http';
import { check } from 'k6';

export const options = {
    // Configuración agresiva: 20 bots golpeando al mismo tiempo
    vus: 20,
    // Solo dura 3 segundos (queremos ver la velocidad de reacción inmediata)
    duration: '3s',

    thresholds: {
        // Definimos el éxito al revés: Queremos ver errores 429
        // Si obtenemos 100% de éxitos (200 OK), significa que NO hay protección.
    },
};

export default function () {
    // Usamos la IP directa para evitar problemas de localhost
    const url = 'http://127.0.0.1:3000/auth/login';

    const payload = JSON.stringify({
        email: 'alumno@test.com',
        password: 'password123',
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
            // Simulamos ser un bot descarado (User-Agent)
            'User-Agent': 'BotScraper/1.0',
        },
    };

    const res = http.post(url, payload, params);

    // VERIFICACIÓN
    check(res, {
        'Es código 200 (Permitido)': (r) => r.status === 200 || r.status === 201,
        'Es código 429 (Bloqueado por Anti-Scraping)': (r) => r.status === 429,
    });
}