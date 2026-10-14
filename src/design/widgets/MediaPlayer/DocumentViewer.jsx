import { createViewStyles } from "../../viewStyles";
const styles = createViewStyles("DocumentViewer");
import { ActionButton } from "../../Primitives";
import { useState, useEffect, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
function DocumentViewer({
  url,
  fileName = '',
  contentType = '',
  compact = false,
  files = null,
  onError = null,
  showViewer = true,
  onProgressUpdate = null,
  onComplete = null,
  onReachedEnd = null,
  showMarkComplete = false,
  isComplete = false,
  segmentId = null
}) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeDocIndex, setActiveDocIndex] = useState(0);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [hasReachedEnd, setHasReachedEnd] = useState(isComplete);
  const [maxPageReached, setMaxPageReached] = useState(1);
  const docxContainerRef = useRef(null);
  const getExtension = name => {
    const cleanName = name?.split('?')[0] || name;
    return cleanName?.split('.').pop()?.toLowerCase() || '';
  };
  const isPDF = name => getExtension(name) === 'pdf';
  const isDOCX = name => ['doc', 'docx'].includes(getExtension(name));
  const isImage = name => ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(getExtension(name));
  const isTXT = name => getExtension(name) === 'txt';
  const getFileIcon = name => {
    const ext = getExtension(name);
    if (ext === 'pdf') {
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`${styles.fileIcon} ${styles.pdf}`}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <text x="12" y="16" fontSize="6" fill="currentColor" textAnchor="middle" fontWeight="bold">PDF</text>
        </svg>;
    }
    if (['doc', 'docx'].includes(ext)) {
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`${styles.fileIcon} ${styles.doc}`}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="8" y1="13" x2="16" y2="13" />
          <line x1="8" y1="17" x2="14" y2="17" />
        </svg>;
    }
    if (['ppt', 'pptx'].includes(ext)) {
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`${styles.fileIcon} ${styles.ppt}`}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <rect x="8" y="12" width="8" height="6" rx="1" />
        </svg>;
    }
    if (['xls', 'xlsx'].includes(ext)) {
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`${styles.fileIcon} ${styles.xls}`}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="8" y1="12" x2="16" y2="12" />
          <line x1="8" y1="15" x2="16" y2="15" />
          <line x1="12" y1="12" x2="12" y2="18" />
        </svg>;
    }
    if (isImage(name)) {
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`${styles.fileIcon} ${styles.img}`}>
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>;
    }
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={styles.fileIcon}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>;
  };
  const handleError = useCallback(e => {
    console.error('Document load error:', e);
    setError(true);
    setLoading(false);
    if (onError) onError(e);
  }, [onError]);
  const prepareDocuments = () => {
    if (files && files.length > 0) {
      return files.map(file => ({
        uri: file.url || file.presignedUrl,
        fileName: file.fileName || file.name || 'Document'
      }));
    }
    if (url) {
      return [{
        uri: url,
        fileName: fileName || 'Document'
      }];
    }
    return [];
  };
  const documents = prepareDocuments();
  const currentDoc = documents[activeDocIndex] || documents[0];
  useEffect(() => {
    if (!currentDoc?.uri || !isDOCX(currentDoc.fileName) || !showViewer || compact) {
      return;
    }
    const loadDocx = async () => {
      setLoading(true);
      setError(false);
      try {
        const docxPreview = await import('docx-preview');
        const response = await fetch(currentDoc.uri);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        if (docxContainerRef.current) {
          docxContainerRef.current.innerHTML = '';
          await docxPreview.renderAsync(blob, docxContainerRef.current, null, {
            className: 'docx-wrapper',
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
            ignoreFonts: false,
            breakPages: true,
            useBase64URL: true
          });
        }
        setLoading(false);
      } catch (err) {
        console.error('Failed to load DOCX:', err);
        setError(true);
        setLoading(false);
      }
    };
    loadDocx();
  }, [currentDoc?.uri, currentDoc?.fileName, showViewer, compact]);
  const onDocumentLoadSuccess = ({
    numPages
  }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setLoading(false);
    if (numPages === 1) {
      setHasReachedEnd(true);
      if (onReachedEnd) onReachedEnd(1, 1, 100);
    }
  };
  const goToPrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => {
    const nextPage = Math.min(pageNumber + 1, numPages || 1);
    setPageNumber(nextPage);
    if (nextPage > maxPageReached) {
      setMaxPageReached(nextPage);
      const progress = Math.round(nextPage / (numPages || 1) * 100);
      if (onProgressUpdate) {
        onProgressUpdate(nextPage, numPages, progress);
      }
    }
    if (nextPage === numPages && !hasReachedEnd) {
      setHasReachedEnd(true);
      if (onReachedEnd) onReachedEnd(nextPage, numPages, 100);
    }
  };
  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const handleMarkComplete = () => {
    if (onComplete) {
      onComplete(pageNumber, numPages, 100);
    }
  };
  if (files && files.length > 0 && (compact || !showViewer)) {
    return <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
        <div className={styles.documentsList}>
          {files.map((file, index) => {
          const fileUrl = file.url || file.presignedUrl || file;
          const name = file.fileName || file.name || `Document ${index + 1}`;
          const ext = getExtension(name);
          return <a key={index} href={fileUrl} target="_blank" rel="noopener noreferrer" className={styles.documentItem}>
                {getFileIcon(name)}
                <div className={styles.documentInfo}>
                  <span className={styles.documentName} title={name}>{name}</span>
                  <span className={styles.documentType}>{ext.toUpperCase()}</span>
                </div>
                <svg className={styles.downloadIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </a>;
        })}
        </div>
      </div>;
  }
  if (documents.length === 0) {
    return <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
        <div className={styles.placeholder}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span>No document available</span>
        </div>
      </div>;
  }
  if (showViewer && !compact && currentDoc) {
    const renderDocumentContent = () => {
      if (error) {
        return <div className={styles.error}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span>Failed to load document</span>
            <a href={currentDoc.uri} target="_blank" rel="noopener noreferrer" className={styles.downloadLink}>
              Download instead
            </a>
          </div>;
      }
      if (isPDF(currentDoc.fileName)) {
        return <div className={styles.pdfViewer}>
            <div className={styles.pdfControls}>
              <div className={styles.controlsLeft}>
                <ActionButton onClick={goToPrevPage} disabled={pageNumber <= 1} className={styles.pdfBtn}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </ActionButton>
                <span className={styles.pageInfo}>
                  Page {pageNumber} of {numPages || '...'}
                </span>
                <ActionButton onClick={goToNextPage} disabled={pageNumber >= (numPages || 1)} className={styles.pdfBtn}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </ActionButton>
                <div className={styles.zoomControls}>
                  <ActionButton onClick={zoomOut} className={styles.pdfBtn}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      <line x1="8" y1="11" x2="14" y2="11" />
                    </svg>
                  </ActionButton>
                  <span className={styles.zoomLevel}>{Math.round(scale * 100)}%</span>
                  <ActionButton onClick={zoomIn} className={styles.pdfBtn}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      <line x1="11" y1="8" x2="11" y2="14" />
                      <line x1="8" y1="11" x2="14" y2="11" />
                    </svg>
                  </ActionButton>
                </div>

                {}
                {numPages > 1 && <div className={styles.progressIndicator}>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{
                    width: `${Math.round(maxPageReached / numPages * 100)}%`
                  }} />
                    </div>
                  </div>}
              </div>

              {}
              {showMarkComplete && <div className={styles.completeHeader}>
                  {isComplete ? <div className={styles.completedBadgeSmall}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>Completed</span>
                    </div> : <ActionButton className={styles.btnMarkCompleteHeader} onClick={handleMarkComplete} title="Mark as done">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Mark as Complete
                    </ActionButton>}
                </div>}
            </div>
            <div className={styles.pdfDocumentWrapper}>
              <Document file={currentDoc.uri} onLoadSuccess={onDocumentLoadSuccess} onLoadError={handleError} loading={<div className={styles.loading}>
                    <div className="spinner"></div>
                    <span>Loading PDF...</span>
                  </div>}>
                <Page pageNumber={pageNumber} scale={scale} renderTextLayer={true} renderAnnotationLayer={true} />
              </Document>
            </div>
          </div>;
      }
      if (isDOCX(currentDoc.fileName)) {
        return <div className={styles.docxViewer}>
            {}
            {showMarkComplete && <div className={styles.headerControls}>
                {isComplete ? <div className={styles.completedBadgeSmall}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Completed</span>
                  </div> : <ActionButton className={styles.btnMarkCompleteHeader} onClick={handleMarkComplete} title="Mark as done">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Mark as Complete
                  </ActionButton>}
              </div>}
            <div ref={docxContainerRef} className={styles.docxContainer} />
          </div>;
      }
      if (isImage(currentDoc.fileName)) {
        return <div className={styles.imageViewer}>
            {}
            {showMarkComplete && <div className={styles.headerControls}>
                {isComplete ? <div className={styles.completedBadgeSmall}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Completed</span>
                  </div> : <ActionButton className={styles.btnMarkCompleteHeader} onClick={handleMarkComplete} title="Mark as done">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Mark as Complete
                  </ActionButton>}
              </div>}
            <img src={currentDoc.uri} alt={currentDoc.fileName} onLoad={() => setLoading(false)} onError={handleError} />
          </div>;
      }
      if (isTXT(currentDoc.fileName)) {
        return <TextFileViewer url={currentDoc.uri} onLoad={() => setLoading(false)} onError={handleError} />;
      }
      return <div className={styles.unsupportedFile}>
          {}
          {showMarkComplete && <div className={`${styles.headerControls} ${styles.unsupportedHeader}`}>
              {isComplete ? <div className={styles.completedBadgeSmall}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Completed</span>
                </div> : <ActionButton className={styles.btnMarkCompleteHeader} onClick={handleMarkComplete} title="Mark as done">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Mark as Complete
                </ActionButton>}
            </div>}
          <div className={styles.unsupportedContent}>
            {getFileIcon(currentDoc.fileName)}
            <span className={styles.unsupportedMessage}>
              Preview not available for {getExtension(currentDoc.fileName).toUpperCase()} files
            </span>
            <a href={currentDoc.uri} target="_blank" rel="noopener noreferrer" className={styles.downloadBtn}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download File
            </a>
          </div>
        </div>;
    };
    return <div className={`${styles.container} ${styles.viewerMode}`}>
        {}
        {documents.length > 1 && <div className={styles.tabs}>
            {documents.map((doc, index) => <ActionButton key={index} className={`${styles.tab} ${activeDocIndex === index ? styles.active : ''}`} onClick={() => {
          setActiveDocIndex(index);
          setLoading(true);
          setError(false);
          setPageNumber(1);
        }}>
                {getFileIcon(doc.fileName)}
                <span className={styles.tabName} title={doc.fileName}>{doc.fileName}</span>
              </ActionButton>)}
          </div>}

        {}
        <div className={styles.viewerWrapper}>
          {loading && !isPDF(currentDoc?.fileName) && <div className={styles.loading}>
              <div className="spinner"></div>
              <span>Loading document...</span>
            </div>}

          {renderDocumentContent()}
        </div>

        {}
        <div className={styles.footer}>
          <span className={styles.fileName} title={currentDoc.fileName}>{currentDoc.fileName}</span>
          <a href={currentDoc.uri} target="_blank" rel="noopener noreferrer" className={styles.openLink}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.externalIcon}>
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Open in new tab
          </a>
        </div>
      </div>;
  }
  return <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
      <a href={url} target="_blank" rel="noopener noreferrer" className={styles.documentCard}>
        {getFileIcon(fileName)}
        <div className={styles.documentInfo}>
          <span className={styles.documentName} title={fileName}>{fileName || 'Document'}</span>
          <span className={styles.documentType}>{getExtension(fileName).toUpperCase() || 'FILE'}</span>
        </div>
        <svg className={styles.downloadIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </a>
    </div>;
}
function TextFileViewer({
  url,
  onLoad,
  onError
}) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(url).then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    }).then(text => {
      setContent(text);
      setLoading(false);
      onLoad?.();
    }).catch(err => {
      console.error('Failed to load text file:', err);
      onError?.(err);
    });
  }, [url]);
  if (loading) {
    return <div className={styles.loading}>
        <div className="spinner"></div>
        <span>Loading text file...</span>
      </div>;
  }
  return <div className={styles.textViewer}>
      <pre>{content}</pre>
    </div>;
}
export default DocumentViewer;
