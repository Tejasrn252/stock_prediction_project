const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:5000";

export const apiUrl = (path) => {
	if (!path) return API_BASE_URL;
	if (path.startsWith("http://") || path.startsWith("https://")) {
		return path;
	}

	if (API_BASE_URL && path.startsWith("/")) {
		return `${API_BASE_URL}${path}`;
	}

	if (API_BASE_URL && !path.startsWith("/")) {
		return `${API_BASE_URL}/${path}`;
	}

	return path;
};
