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
        const userStr = localStorage.getItem('user');
        
        // Agar user item hi nahi hai localStorage mein
        if (userStr === null || userStr === '') {
            return null;
        }
        
        const user = JSON.parse(userStr);
        return user;
    } catch (err) {
        console.error('Error getting user from localStorage:', err);
        return null;
    }
};