const parseJwt = (token: string) => {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch {
        return null;
    }
};

const getTokenExpiration = (token: string): number | null => {
    const payload = parseJwt(token);
    if (!payload?.exp) return null;

    return payload.exp * 1000; // 🔥 convert seconds → ms
};

// Check if expired
const isTokenExpired = (token: string): boolean => {
    const exp = getTokenExpiration(token);
    if (!exp) return true;

    return Date.now() >= exp;
};


export { getTokenExpiration, isTokenExpired }