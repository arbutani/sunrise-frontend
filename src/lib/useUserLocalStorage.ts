export const setUserData = (user: any) => {
    try {
        localStorage.setItem('user', JSON.stringify(user));
    } catch (err) { }
};
export const removeUserData = () => {
    try {
        localStorage.removeItem('user');
    } catch (err) { }
};
export const getUser = () => {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '');

        if (user === null) {
            return undefined;
        }
        return user;
    } catch (err) {
        return null;
    }
};
