let configCache = null;

export async function getConfig() {
  // Always reload config in development to pick up changes
  const hostname = window.location.hostname;
  const isLocalhost = hostname.includes('localhost') || hostname === '127.0.0.1';
  
  // Clear cache for localhost to allow config changes
  if (isLocalhost) {
    configCache = null;
  }
  
  if (configCache) return configCache;
  
  let configFile = '';  

  // Choose config file based on hostname
  if (isLocalhost) {
    configFile = '/config.local.json';
  } else {
    configFile = '/config.dev.json';
  }

  const res = await fetch(configFile);
  if (!res.ok) throw new Error(`Failed to load config: ${res.status}`);
  configCache = await res.json();

  return configCache;
}
