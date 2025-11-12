import { io } from 'socket.io-client';

let socket;

function getApiBase() {
    const api = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    // strip trailing /api if present
    return api.replace(/\/api\/?$/, '');
}

export function connectSocket(token) {
    if (socket && socket.connected) return socket;
    const url = getApiBase();
    socket = io(url, {
        transports: ['websocket'],
        auth: { token },
    });
    return socket;
}

export function getSocket() {
    return socket;
}

export default { connectSocket, getSocket };
