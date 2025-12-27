const API_BASE_URL = 'http://127.0.0.1:5001/echo-1928rn/us-central1/api';

export const apiRequest = async (endpoint: string, method: string = 'GET', body?: any, token?: string) => {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'API Request Failed');
        }

        return res.json();
    } catch (error) {
        console.error(`API Error [${endpoint}]:`, error);
        throw error;
    }
};
