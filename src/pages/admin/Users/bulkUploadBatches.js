// CloudFront's managed body-size rule rejects bodies over 8 KB. Keep each
// authenticated request below 7 KB, including JSON metadata and Unicode text.
export function buildStudentBatches(rows, collegeName) {
  if (!rows.length) throw new Error('The spreadsheet has no student rows.')
  if (rows.length > 5000) throw new Error('Upload at most 5,000 students per file.')
  const encoder = new TextEncoder()
  const batches = []
  let batch = []
  let offset = 0
  const size = items => encoder.encode(JSON.stringify({ college_name: collegeName, total: rows.length, offset,
    jobId: '00000000-0000-0000-0000-000000000000', rows: items })).length
  for (const row of rows) {
    const student = { ...row, __rowNum__: row.__rowNum__ }
    if (size([...batch, student]) > 7000) {
      if (!batch.length) throw new Error('A spreadsheet row is too large. Remove extra columns and use the template.')
      batches.push({ offset, rows: batch })
      offset += batch.length
      batch = []
    }
    if (size([student]) > 7000) throw new Error('A spreadsheet row is too large. Remove extra columns and use the template.')
    batch.push(student)
  }
  if (batch.length) batches.push({ offset, rows: batch })
  return batches
}
