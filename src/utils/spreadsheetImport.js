export async function uploadSpreadsheet({ file, purpose, endpoint, apiBaseUrl, accessToken, fetchImpl = fetch }) {
  if (!file || !/\.(xlsx|xls)$/i.test(file.name) || !file.size || file.size > 10 * 1024 * 1024) throw new Error('Choose an Excel workbook (.xlsx or .xls) up to 10 MB.');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` };
  const readJSON = async response => {
    try { return await response.json(); }
    catch { throw new Error(`The upload service returned an unexpected response (${response.status}). Please try again.`); }
  };
  const prepared = await fetchImpl(`${apiBaseUrl}/api/questions/bulk-upload/file`, {
    method: 'POST', headers, body: JSON.stringify({ fileName: /\.xlsx$/i.test(file.name) ? 'workbook.xlsx' : 'workbook.xls', fileSize: file.size, purpose })
  });
  const ticket = await readJSON(prepared);
  if (!prepared.ok) throw new Error(ticket.error || 'Unable to prepare the workbook upload.');
  if (!ticket.presignedUrl || !ticket.importTicket || !ticket.contentType) throw new Error('The workbook upload could not be prepared. Please try again.');
  const stored = await fetchImpl(ticket.presignedUrl, { method: 'PUT', headers: { 'Content-Type': ticket.contentType }, body: file, credentials: 'omit' });
  if (!stored.ok) throw new Error(`File storage rejected the workbook (${stored.status}). Select the file and try again.`);
  const response = await fetchImpl(`${apiBaseUrl}${endpoint}`, { method: 'POST', headers, body: JSON.stringify({ importTicket: ticket.importTicket }) });
  return { response, data: await readJSON(response) };
}
