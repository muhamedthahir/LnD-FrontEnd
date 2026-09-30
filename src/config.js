let configPromise = null;

export async function getConfig() {
  // Share concurrent requests and keep config stable for the lifetime of the page.
  // A reload picks up local edits; failures can be retried by the next caller.
  if (configPromise) return configPromise;
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
  
  let configFile = '';  

  // Choose config file based on hostname
  if (isLocalhost) {
    configFile = '/config.local.json';
  } else {
    configFile = '/config.dev.json';
  }

  configPromise = fetch(configFile)
    .then(res => {
      if (!res.ok) throw new Error(`Failed to load config: ${res.status}`);
      return res.json();
    })
    .catch(error => {
      configPromise = null;
      throw error;
    });
  return configPromise;
}
