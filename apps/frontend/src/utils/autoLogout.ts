import { getTokenExpiration } from "./expirationGetter"

function autoLogout(token: string) {
    const expiresAt = getTokenExpiration(token)
    if (!expiresAt) return;

    const timeout = expiresAt * 1000 - Date.now()

    if (timeout <= 0) {
        logout();
        return;
    }

    setTimeout(() => {
        logout();
    }, timeout);
}

function logout() {
    localStorage.removeItem("token");
    window.location.href = "/login";
}

export { autoLogout }