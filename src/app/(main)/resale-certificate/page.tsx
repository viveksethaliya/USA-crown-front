'use client';

import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import styles from './page.module.css';

const TEMPLATE_URL = '/NYS-ResaleCertificate-ST120.pdf';
const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;

type TextFieldName =
  | 'purchaserName' | 'purchaserAddress' | 'purchaserCity' | 'purchaserState'
  | 'purchaserZip' | 'business' | 'principallySell' | 'certificateAuthority1'
  | 'certificateAuthority2' | 'expiresOn' | 'jurisdiction' | 'registrationNumber'
  | 'signerName' | 'phone' | 'email' | 'datePrepared';

type FormValues = Record<TextFieldName, string> & {
  certificateType: 'single' | 'blanket' | '';
  vendorType: 'vendor' | 'temporary' | '';
  purchases: Record<'a' | 'b' | 'c' | 'd' | 'e', boolean>;
  signature: string | null;
};

type Rect = readonly [number, number, number, number];

const INITIAL_VALUES: FormValues = {
  purchaserName: '', purchaserAddress: '', purchaserCity: '', purchaserState: '', purchaserZip: '',
  business: '', principallySell: '', certificateAuthority1: '', certificateAuthority2: '', expiresOn: '',
  jurisdiction: '', registrationNumber: '', signerName: '', phone: '', email: '', datePrepared: '',
  certificateType: '', vendorType: '', purchases: { a: false, b: false, c: false, d: false, e: false }, signature: null,
};

// Coordinates are PDF points from the official, fillable ST-120 form (612 x 792 points).
const TEXT_RECTS: Record<TextFieldName, Rect> = {
  purchaserName: [306, 87, 588, 102], purchaserAddress: [306, 111, 588, 127],
  purchaserCity: [306, 135, 465, 150], purchaserState: [468, 135, 522, 150], purchaserZip: [525, 135, 588, 150],
  business: [156, 265, 331, 276], principallySell: [414, 265, 590, 276],
  certificateAuthority1: [198, 337, 353, 349], certificateAuthority2: [361, 348, 457, 360], expiresOn: [527, 348, 589, 360],
  jurisdiction: [272, 512, 549, 523], registrationNumber: [209, 524, 435, 535],
  signerName: [24, 708, 178, 724], phone: [215, 708, 305, 724], email: [337, 708, 587, 724], datePrepared: [449, 732, 588, 747],
};

const PDF_FIELD_NAMES: Record<TextFieldName, string> = {
  purchaserName: "purchaser's name", purchaserAddress: "purchaser's address", purchaserCity: 'purchaser city',
  purchaserState: 'purchaser state', purchaserZip: 'purchaser zip code', business: 'i am engaged in the business of',
  principallySell: 'and principally sell', certificateAuthority1: 'coa number 1', certificateAuthority2: 'coa number 2',
  expiresOn: 'and expires on', jurisdiction: 'state/jurisdiction', registrationNumber: 'registration number',
  signerName: "print signer's name", phone: 'phone', email: 'email', datePrepared: 'date signed',
};

function position(rect: Rect) {
  const [left, top, right, bottom] = rect;
  return { left: `${(left / PAGE_WIDTH) * 100}%`, top: `${(top / PAGE_HEIGHT) * 100}%`, width: `${((right - left) / PAGE_WIDTH) * 100}%`, height: `${((bottom - top) / PAGE_HEIGHT) * 100}%` };
}

export default function ResaleCertificatePage() {
  const canvasHost = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [isPreparing, setIsPreparing] = useState(false);
  const [renderError, setRenderError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function renderTemplate() {
      try {
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
        pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url).toString();
        const document = await pdfjs.getDocument({ url: TEMPLATE_URL }).promise;
        if (!canvasHost.current || cancelled) return;
        canvasHost.current.replaceChildren();
        for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
          const page = await document.getPage(pageNumber);
          const viewport = page.getViewport({ scale: 2 });
          const canvas = window.document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.className = styles.pdfCanvas;
          await page.render({ canvas, canvasContext: canvas.getContext('2d')!, viewport }).promise;
          if (!cancelled) canvasHost.current?.append(canvas);
        }
      } catch (error) {
        console.error('Unable to render ST-120 preview', error);
        if (!cancelled) setRenderError(true);
      }
    }
    renderTemplate();
    return () => { cancelled = true; };
  }, []);

  const setText = (field: TextFieldName) => (event: ChangeEvent<HTMLInputElement>) => setValues(current => ({ ...current, [field]: event.target.value }));
  const setPurchase = (purchase: keyof FormValues['purchases']) => (event: ChangeEvent<HTMLInputElement>) => setValues(current => ({ ...current, purchases: { ...current.purchases, [purchase]: event.target.checked } }));

  async function uploadSignature(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setValues(current => ({ ...current, signature: URL.createObjectURL(file) }));
  }

  async function downloadPdf() {
    setIsPreparing(true);
    try {
      const template = await fetch(TEMPLATE_URL).then(response => response.arrayBuffer());
      const pdf = await PDFDocument.load(template);
      const form = pdf.getForm();
      Object.entries(PDF_FIELD_NAMES).forEach(([key, pdfName]) => {
        const field = form.getTextField(pdfName);
        const value = values[key as TextFieldName] || '';
        
        // Some official PDF fields (like State) have strict max lengths.
        // We remove the max length constraint so the full text can be rendered.
        field.setMaxLength(1000);
        
        field.setText(value);
      });
      if (values.certificateType) form.getRadioGroup('single-use certificate').select(values.certificateType === 'single' ? 'Yes' : 'No');
      if (values.vendorType) form.getRadioGroup('I certify that I am').select(values.vendorType === 'vendor' ? 'Yes' : 'No');
      (['a', 'b', 'c', 'd', 'e'] as const).forEach((letter, index) => {
        const checkbox = form.getCheckBox(`I am purchasing ${index + 1}`);
        values.purchases[letter] ? checkbox.check() : checkbox.uncheck();
      });
      form.updateFieldAppearances(await pdf.embedFont(StandardFonts.Helvetica));
      if (values.signature) {
        const imageBytes = await fetch(values.signature).then(response => response.arrayBuffer());
        const image = values.signature.startsWith('blob:') ? await pdf.embedPng(imageBytes).catch(() => pdf.embedJpg(imageBytes)) : undefined;
        if (image) {
          const page = pdf.getPage(0);
          const ratio = Math.min(410 / image.width, 38 / image.height);
          page.drawImage(image, { x: 28, y: 19, width: image.width * ratio, height: image.height * ratio });
        }
      }
      const bytes = await pdf.save();
      const output = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
      const url = URL.createObjectURL(new Blob([output], { type: 'application/pdf' }));
      const anchor = window.document.createElement('a');
      anchor.href = url;
      anchor.download = 'NYS-ST-120-resale-certificate.pdf';
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Unable to prepare ST-120 PDF', error);
      window.alert('The PDF could not be prepared. Please try again.');
    } finally { setIsPreparing(false); }
  }

  return <main className={styles.shell}>
    <section className={styles.toolbar} aria-label="Certificate actions">
      <div><p className={styles.eyebrow}>New York State form ST-120</p><h1>Resale Certificate</h1><p>Complete the fields directly on the official certificate, then download the filled PDF.</p></div>
      <button type="button" onClick={downloadPdf} disabled={isPreparing}>{isPreparing ? 'Preparing PDF…' : 'Download PDF'}</button>
    </section>
    <div className={styles.documentScroller}>
      <div className={styles.document}>
        <div ref={canvasHost} className={styles.canvasPages} aria-hidden="true" />
        {renderError && <iframe className={styles.fallbackPdf} src={TEMPLATE_URL} title="ST-120 official form" />}
        <section className={styles.formLayer} aria-label="Editable ST-120 fields">
          {Object.entries(TEXT_RECTS).map(([field, rect]) => <input key={field} aria-label={field.replace(/([A-Z])/g, ' $1')} className={styles.textField} style={position(rect)} value={values[field as TextFieldName]} onChange={setText(field as TextFieldName)} />)}
          <fieldset className={styles.choiceGroup} style={position([169, 156, 301, 168])}><legend>Certificate type</legend><label style={{ left: '0%', top: 0, width: '9%', height: '100%' }}><input type="radio" name="certificate" checked={values.certificateType === 'single'} onChange={() => setValues(v => ({ ...v, certificateType: 'single' }))} /></label><label style={{ right: 0, top: 0, width: '9%', height: '100%' }}><input type="radio" name="certificate" checked={values.certificateType === 'blanket'} onChange={() => setValues(v => ({ ...v, certificateType: 'blanket' }))} /></label></fieldset>
          <fieldset className={styles.choiceGroup} style={position([24, 324, 36, 360])}><legend>Vendor type</legend><label style={{ left: 0, top: 0, width: '100%', height: '33.333%' }}><input type="radio" name="vendor" checked={values.vendorType === 'vendor'} onChange={() => setValues(v => ({ ...v, vendorType: 'vendor' }))} /></label><label style={{ left: 0, bottom: 0, width: '100%', height: '33.333%' }}><input type="radio" name="vendor" checked={values.vendorType === 'temporary'} onChange={() => setValues(v => ({ ...v, vendorType: 'temporary' }))} /></label></fieldset>
          {(['a', 'b', 'c', 'd', 'e'] as const).map((letter, index) => {
            const purchaseRects: readonly Rect[] = [[24, 384, 36, 396], [24, 444, 36, 456], [24, 463, 36, 475], [24, 579, 36, 591], [24, 603, 36, 615]];
            return <label key={letter} className={styles.checkbox} style={position(purchaseRects[index])}><input type="checkbox" aria-label={`Purchase option ${letter.toUpperCase()}`} checked={values.purchases[letter]} onChange={setPurchase(letter)} /></label>;
          })}
          <label className={styles.signatureField} style={position([24, 724, 449, 772])}><span>{values.signature ? <img src={values.signature} alt="Uploaded signature" /> : 'Upload signature'}</span><input type="file" accept="image/png,image/jpeg" aria-label="Upload signature image" onChange={uploadSignature} /></label>
        </section>
      </div>
    </div>
  </main>;
}
