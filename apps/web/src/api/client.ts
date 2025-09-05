import axios from 'axios';

// Build-time injected by Vite for prod; dev falls back to proxy.
const baseURL = import.meta.env.VITE_API_BASE || '/api';

export const http = axios.create({ baseURL });

