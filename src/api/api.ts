import axios from "axios"

const api = axios.create({
    baseURL: import.meta.env.VITE_GITHUB_URL || 'https://api.github.com/',
    headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "Awesome-Octocat-App",
        "X-GitHub-Api-Version": "2022-11-28",
    },
});



export default api;