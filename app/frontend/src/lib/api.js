"import axios from \"axios\";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

export function formatApiError(detail) {
  if (detail == null) return \"Something went wrong. Please try again.\";
  if (typeof detail === \"string\") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === \"string\" ? e.msg : JSON.stringify(e))).filter(Boolean).join(\" \");
  if (detail && typeof detail.msg === \"string\") return detail.msg;
  return String(detail);
}

export function imgUrl(path) {
  if (!path) return \"\";
  if (/^https?:\/\//.test(path)) return path;
  return `${BACKEND_URL}${path}`;
}

export function inr(n) {
  const x = Number(n || 0);
  return `₹${x.toLocaleString(\"en-IN\", { maximumFractionDigits: 2 })}`;
}
"