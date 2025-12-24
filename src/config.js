let configCache = null;

export async function getConfig() {
  if (configCache) return configCache;
  let configFile = '';

  // Choose config file based on hostname
  const hostname = window.location.hostname;

  if (hostname.includes('localhost')) {
    configFile = '/config.dev.json';
  } else {
    configFile = '/config.dev.json';
  }

  const res = await fetch(configFile);
  if (!res.ok) throw new Error(`Failed to load config: ${res.status}`);
  configCache = await res.json();

  return configCache;
}
