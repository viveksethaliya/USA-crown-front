'use client';

import Link from 'next/link';
import { useState, useRef } from 'react';
import styles from './apply.module.css';
import { FiX } from 'react-icons/fi';
import { apiUrl } from '@/lib/cart';



export default function ApplyPage() {
  const [step, setStep] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [errorField, setErrorField] = useState('');

  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const hearAboutRef = useRef<HTMLSelectElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  const companyNameRef = useRef<HTMLInputElement>(null);
  const companyWebsiteRef = useRef<HTMLInputElement>(null);
  const addressLineRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const resaleTaxIdRef = useRef<HTMLInputElement>(null);
  const cityRef = useRef<HTMLInputElement>(null);
  const zipCodeRef = useRef<HTMLInputElement>(null);
  const stateProvinceRef = useRef<HTMLInputElement>(null);
  const countryRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Step 1: Personal Information
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [hearAbout, setHearAbout] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2: Company Information
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [additionalCompanyDetails, setAdditionalCompanyDetails] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [phone, setPhone] = useState('');
  const [resaleTaxId, setResaleTaxId] = useState('');
  const [city, setCity] = useState('');
  const [fax, setFax] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [stateProvince, setStateProvince] = useState('');
  const [country, setCountry] = useState('');
  const [creditApp, setCreditApp] = useState('');

  // Step 3: Resale Certificate
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleNext = () => {
    if (step === 1) {
      if (!firstName.trim()) { setErrorField('firstName'); firstNameRef.current?.focus(); return; }
      if (!lastName.trim()) { setErrorField('lastName'); lastNameRef.current?.focus(); return; }
      if (!email.trim() || !/\S+@\S+\.\S+/.test(email.trim())) { setErrorField('email'); emailRef.current?.focus(); return; }
      if (!hearAbout) { setErrorField('hearAbout'); hearAboutRef.current?.focus(); return; }
      if (!password) { setErrorField('password'); passwordRef.current?.focus(); return; }
      if (!confirmPassword) { setErrorField('confirmPassword'); confirmPasswordRef.current?.focus(); return; }
    } else if (step === 2) {
      if (!companyName.trim()) { setErrorField('companyName'); companyNameRef.current?.focus(); return; }
      if (companyWebsite.trim() && !/^(https?:\/\/)?([\w\d\.-]+)\.([a-z\.]{2,6})(\/[\w\d\.-]*)*\/?$/i.test(companyWebsite.trim())) { setErrorField('companyWebsite'); companyWebsiteRef.current?.focus(); return; }
      if (!addressLine.trim()) { setErrorField('addressLine'); addressLineRef.current?.focus(); return; }
      if (!phone.trim()) { setErrorField('phone'); phoneRef.current?.focus(); return; }
      if (!resaleTaxId.trim()) { setErrorField('resaleTaxId'); resaleTaxIdRef.current?.focus(); return; }
      if (!city.trim()) { setErrorField('city'); cityRef.current?.focus(); return; }
      if (!zipCode.trim()) { setErrorField('zipCode'); zipCodeRef.current?.focus(); return; }
      if (!stateProvince.trim()) { setErrorField('stateProvince'); stateProvinceRef.current?.focus(); return; }
      if (!country) { setErrorField('country'); countryRef.current?.focus(); return; }
    }
    setErrorField('');
    if (step < 3) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).slice(0, 2);
    setUploadedFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 2);
      setUploadedFiles(files);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadedFiles.length === 0) {
      setErrorField('certificates');
      setSubmitError('Please upload your signed resale certificate.');
      dropZoneRef.current?.focus();
      return;
    }
    setErrorField('');
    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const formData = new FormData();
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('email', email);
      formData.append('hearAbout', hearAbout);
      formData.append('password', password);
      formData.append('companyName', companyName);
      formData.append('companyWebsite', companyWebsite);
      formData.append('additionalCompanyDetails', additionalCompanyDetails);
      formData.append('addressLine', addressLine);
      formData.append('phone', phone);
      formData.append('resaleTaxId', resaleTaxId);
      formData.append('city', city);
      formData.append('fax', fax);
      formData.append('zipCode', zipCode);
      formData.append('stateProvince', stateProvince);
      formData.append('country', country);
      formData.append('creditApp', creditApp);

      uploadedFiles.forEach((file) => {
        formData.append('certificates', file);
      });

      const response = await fetch(apiUrl('/api/store/auth/register'), {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit registration');
      }

      setSubmitSuccess(true);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'An error occurred during submission');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.formCard} style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <h2 className={styles.stepTitle} style={{ color: 'green' }}>Registration Submitted!</h2>
            <p className={styles.stepDesc} style={{ marginTop: '1rem', fontSize: '1.1rem' }}>
              Your application has been received and is pending review. We will contact you once it is approved.
            </p>
            <Link href="/" className={styles.submitBtn} style={{ display: 'inline-block', marginTop: '2rem', textDecoration: 'none' }}>
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Step Indicator */}
        <div className={styles.stepIndicator}>
          <div className={`${styles.stepItem} ${step >= 1 ? styles.stepActive : ''} ${step > 1 ? styles.stepComplete : ''}`}>
            <div className={styles.stepNumber}>1</div>
            <span className={styles.stepLabel}>Personal Info</span>
          </div>
          <div className={styles.stepLine}></div>
          <div className={`${styles.stepItem} ${step >= 2 ? styles.stepActive : ''} ${step > 2 ? styles.stepComplete : ''}`}>
            <div className={styles.stepNumber}>2</div>
            <span className={styles.stepLabel}>Company Info</span>
          </div>
          <div className={styles.stepLine}></div>
          <div className={`${styles.stepItem} ${step >= 3 ? styles.stepActive : ''}`}>
            <div className={styles.stepNumber}>3</div>
            <span className={styles.stepLabel}>Resale Certificate</span>
          </div>
        </div>

        {/* Form Card */}
        <div className={styles.formCard}>
          <form className={styles.form} onSubmit={handleSubmit} noValidate>

            {/* ===== STEP 1: Personal Information ===== */}
            {step === 1 && (
              <div className={styles.stepContent}>
                <h2 className={styles.stepTitle}>Personal Information</h2>
                <p className={styles.stepDesc}>
                  Please fill out and submit the registration form to gain full access to the Crown Findings Co., INC Website.
                </p>

                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Name <span className={styles.required}>*</span></label>
                    <div className={styles.nameRow}>
                      <div className={styles.nameField}>
                        <input
                          ref={firstNameRef}
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className={`${styles.input} ${errorField === 'firstName' ? styles.errorBlink : ''}`}
                          onAnimationEnd={() => setErrorField('')}
                          placeholder="First name"
                          required
                        />
                        <span className={styles.fieldHint}>First</span>
                      </div>
                      <div className={styles.nameField}>
                        <input
                          ref={lastNameRef}
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className={`${styles.input} ${errorField === 'lastName' ? styles.errorBlink : ''}`}
                          onAnimationEnd={() => setErrorField('')}
                          placeholder="Last Name"
                          required
                        />
                        <span className={styles.fieldHint}>Last</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Email <span className={styles.required}>*</span></label>
                    <input
                      ref={emailRef}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`${styles.input} ${errorField === 'email' ? styles.errorBlink : ''}`}
                      onAnimationEnd={() => setErrorField('')}
                      placeholder="Email"
                      required
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>How did you hear about us? <span className={styles.required}>*</span></label>
                    <select
                      ref={hearAboutRef}
                      value={hearAbout}
                      onChange={(e) => setHearAbout(e.target.value)}
                      className={`${styles.select} ${errorField === 'hearAbout' ? styles.errorBlink : ''}`}
                      onAnimationEnd={() => setErrorField('')}
                      required
                    >
                      <option value="">How did you hear about us?</option>
                      <option value="google">Google Search</option>
                      <option value="referral">Referral</option>
                      <option value="tradeshow">Trade Show</option>
                      <option value="social">Social Media</option>
                      <option value="diamond-district">Diamond District Walk-in</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Password <span className={styles.required}>*</span></label>
                    <input
                      ref={passwordRef}
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${styles.input} ${errorField === 'password' ? styles.errorBlink : ''}`}
                      onAnimationEnd={() => setErrorField('')}
                      placeholder="Password"
                      required
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Confirm Password <span className={styles.required}>*</span></label>
                    <input
                      ref={confirmPasswordRef}
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`${styles.input} ${errorField === 'confirmPassword' ? styles.errorBlink : ''}`}
                      onAnimationEnd={() => setErrorField('')}
                      placeholder="Retype Password"
                      required
                    />
                  </div>
                </div>

                <div className={styles.btnRow}>
                  <button type="button" onClick={handleNext} className={styles.nextBtn}>
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* ===== STEP 2: Company Information ===== */}
            {step === 2 && (
              <div className={styles.stepContent}>
                <h2 className={styles.stepTitle}>Company Information</h2>

                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Company Name <span className={styles.required}>*</span></label>
                    <input
                      ref={companyNameRef}
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className={`${styles.input} ${errorField === 'companyName' ? styles.errorBlink : ''}`}
                      onAnimationEnd={() => setErrorField('')}
                      placeholder="Company Name"
                      required
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Company Website</label>
                    <input
                      ref={companyWebsiteRef}
                      type="url"
                      value={companyWebsite}
                      onChange={(e) => setCompanyWebsite(e.target.value)}
                      className={`${styles.input} ${errorField === 'companyWebsite' ? styles.errorBlink : ''}`}
                      onAnimationEnd={() => setErrorField('')}
                      placeholder="Company Website"
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Additional Company Details</label>
                    <textarea
                      value={additionalCompanyDetails}
                      onChange={(e) => setAdditionalCompanyDetails(e.target.value)}
                      className={styles.input}
                      style={{ resize: 'vertical', minHeight: '80px', padding: '0.8rem 1rem' }}
                      placeholder="Any additional details about your company"
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Address Line <span className={styles.required}>*</span></label>
                    <input
                      ref={addressLineRef}
                      type="text"
                      value={addressLine}
                      onChange={(e) => setAddressLine(e.target.value)}
                      className={`${styles.input} ${errorField === 'addressLine' ? styles.errorBlink : ''}`}
                      onAnimationEnd={() => setErrorField('')}
                      placeholder="Address Line"
                      required
                    />
                  </div>

                  <div className={styles.twoCol}>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Phone <span className={styles.required}>*</span></label>
                      <input
                        ref={phoneRef}
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={`${styles.input} ${errorField === 'phone' ? styles.errorBlink : ''}`}
                        onAnimationEnd={() => setErrorField('')}
                        placeholder="+1 (555) 123-4567"
                        required
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Fax</label>
                      <input
                        type="tel"
                        value={fax}
                        onChange={(e) => setFax(e.target.value)}
                        className={styles.input}
                        placeholder="Fax"
                      />
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Resale/Tax ID Number <span className={styles.required}>*</span></label>
                    <input
                      ref={resaleTaxIdRef}
                      type="text"
                      value={resaleTaxId}
                      onChange={(e) => setResaleTaxId(e.target.value)}
                      className={`${styles.input} ${errorField === 'resaleTaxId' ? styles.errorBlink : ''}`}
                      onAnimationEnd={() => setErrorField('')}
                      placeholder="Resale/Tax Id Number"
                      required
                    />
                  </div>

                  <div className={styles.twoCol}>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>City <span className={styles.required}>*</span></label>
                      <input
                        ref={cityRef}
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className={`${styles.input} ${errorField === 'city' ? styles.errorBlink : ''}`}
                        onAnimationEnd={() => setErrorField('')}
                        placeholder="City"
                        required
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Postal / Zip Code <span className={styles.required}>*</span></label>
                      <input
                        ref={zipCodeRef}
                        type="text"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        className={`${styles.input} ${errorField === 'zipCode' ? styles.errorBlink : ''}`}
                        onAnimationEnd={() => setErrorField('')}
                        placeholder="Postal / Zip Code"
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.twoCol}>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>State / Province / Region <span className={styles.required}>*</span></label>
                      <input
                        ref={stateProvinceRef}
                        type="text"
                        value={stateProvince}
                        onChange={(e) => setStateProvince(e.target.value)}
                        className={`${styles.input} ${errorField === 'stateProvince' ? styles.errorBlink : ''}`}
                        onAnimationEnd={() => setErrorField('')}
                        placeholder="State / Province / Region"
                        required
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Country <span className={styles.required}>*</span></label>
                      <input
                        ref={countryRef}
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className={`${styles.input} ${errorField === 'country' ? styles.errorBlink : ''}`}
                        onAnimationEnd={() => setErrorField('')}
                        placeholder="Country"
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Credit Application <span className={styles.required}>*</span></label>
                    <div className={styles.radioGroup}>
                      <label className={styles.radioLabel}>
                        <input
                          type="radio"
                          name="creditApp"
                          value="yes"
                          checked={creditApp === 'yes'}
                          onChange={(e) => setCreditApp(e.target.value)}
                          className={styles.radio}
                        />
                        Yes, I also want to apply for credit application
                      </label>
                      <label className={styles.radioLabel}>
                        <input
                          type="radio"
                          name="creditApp"
                          value="no"
                          checked={creditApp === 'no'}
                          onChange={(e) => setCreditApp(e.target.value)}
                          className={styles.radio}
                        />
                        No, I don&#39;t want to apply for credit application
                      </label>
                    </div>
                  </div>
                </div>

                <div className={styles.btnRow}>
                  <button type="button" onClick={handlePrev} className={styles.prevBtn}>
                    Previous
                  </button>
                  <button type="button" onClick={handleNext} className={styles.nextBtn}>
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* ===== STEP 3: Resale Certificate ===== */}
            {step === 3 && (
              <div className={styles.stepContent}>
                <h2 className={styles.stepTitle}>Resale Certificate</h2>
                <p className={styles.stepDesc}>
                  Please fill out and submit the registration form to gain full access to the Crown Findings Co., INC Website.
                </p>
                <div className={styles.certificateNotice}>
                  <p>
                    The New York State Resale Certificate ST-120 must be filled out, signed and submitted prior to the approval of your registration.
                  </p>
                </div>

                <Link
                  href="/NYS-ResaleCertificate-ST120.pdf"
                  target="_blank"
                  className={styles.downloadBtn}
                >
                  ↓ Download Resale Certificate
                </Link>

                <p className={styles.uploadInstructions}>
                  The Resale Certificate will open in a New Tab. Fill out the form and upload it back with your signature filled in.
                </p>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Upload Signed Certificate <span className={styles.required}>*</span></label>
                  <div
                    ref={dropZoneRef}
                    tabIndex={-1}
                    className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ''} ${errorField === 'certificates' ? styles.errorBlink : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleFileDrop}
                    onClick={() => fileInputRef.current?.click()}
                    onAnimationEnd={() => setErrorField('')}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      multiple
                      onChange={handleFileSelect}
                      className={styles.fileInput}
                    />
                    <div className={styles.dropIcon}>📄</div>
                    <p className={styles.dropText}>Drag &amp; Drop Files, or <span className={styles.browseLink}>Choose Files</span> to Upload</p>
                    <p className={styles.dropHint}>You can upload up to 2 files.</p>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className={styles.fileList}>
                      {uploadedFiles.map((file, idx) => (
                        <div key={idx} className={styles.fileItem}>
                          <span className={styles.fileName}>📎 {file.name}</span>
                          <button type="button" onClick={() => removeFile(idx)} className={styles.removeFile}><FiX /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.btnRow}>
                  <button type="button" onClick={handlePrev} className={styles.prevBtn}>
                    Previous
                  </button>
                  {submitError && <div className={styles.errorText} style={{ color: 'red', marginBottom: '1rem' }}>{submitError}</div>}
                  <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit Registration Application'}
                  </button>
                </div>
              </div>
            )}

          </form>
        </div>
      </div>
    </div>
  );
}
