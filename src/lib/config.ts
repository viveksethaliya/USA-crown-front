const BACKEND_URL = 'https://api.utilixo.online';

const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || BACKEND_URL;
};

export const API_URL = getBaseUrl();
export const ADMIN_API = `${API_URL}/api/admin`;



