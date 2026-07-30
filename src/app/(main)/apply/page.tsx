'use client';

import Link from 'next/link';
import { useState, useRef } from 'react';
import styles from './apply.module.css';
import { FiX, FiEye, FiEyeOff, FiUploadCloud, FiCheckCircle, FiAlertCircle, FiFileText } from 'react-icons/fi';
import { apiUrl } from '@/lib/cart';
import { toast } from 'react-hot-toast';

export default function ApplyPage() {
  const [step, setStep] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [errorField, setErrorField] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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

  // Password visibility state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { label: '', color: 'transparent', score: 0 };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    
    if (score < 3) return { label: 'Weak', color: '#ff4d4f', score };
    if (score < 5) return { label: 'Medium', color: '#faad14', score };
    return { label: 'Strong', color: '#52c41a', score };
  };
  const strength = getPasswordStrength(password);

  const highlightAndFocus = (fieldName: string, msg: string, ref?: React.RefObject<HTMLElement | null>) => {
    setErrorField(fieldName);
    setErrorMessage(msg);
    if (ref && ref.current) {
      ref.current.focus();
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!firstName.trim()) {
        highlightAndFocus('firstName', 'Please enter your first name.', firstNameRef);
        return;
      }
      if (!lastName.trim()) {
        highlightAndFocus('lastName', 'Please enter your last name.', lastNameRef);
        return;
      }
      if (!email.trim() || !/\S+@\S+\.\S+/.test(email.trim())) {
        highlightAndFocus('email', 'Please enter a valid email address.', emailRef);
        return;
      }
      if (!hearAbout) {
        highlightAndFocus('hearAbout', 'Please select how you heard about us.', hearAboutRef);
        return;
      }
      if (!password) {
        highlightAndFocus('password', 'Please enter a password.', passwordRef);
        return;
      }
      if (getPasswordStrength(password).label === 'Weak') {
        highlightAndFocus('password', 'Password is too weak. It must be at least 8 characters with letters, numbers & special characters.', passwordRef);
        return;
      }
      if (!confirmPassword) {
        highlightAndFocus('confirmPassword', 'Please retype your password to confirm.', confirmPasswordRef);
        return;
      }
      if (password !== confirmPassword) {
        highlightAndFocus('confirmPassword', 'Passwords do not match.', confirmPasswordRef);
        return;
      }
    } else if (step === 2) {
      if (!companyName.trim()) {
        highlightAndFocus('companyName', 'Please enter your company name.', companyNameRef);
        return;
      }
      if (companyWebsite.trim() && !/^(https?:\/\/)?([\w\d\.-]+)\.([a-z\.]{2,6})(\/[\w\d\.-]*)*\/?$/i.test(companyWebsite.trim())) {
        highlightAndFocus('companyWebsite', 'Please enter a valid website URL (e.g. example.com).', companyWebsiteRef);
        return;
      }
      if (!addressLine.trim()) {
        highlightAndFocus('addressLine', 'Please enter your business address line.', addressLineRef);
        return;
      }
      if (!phone.trim()) {
        highlightAndFocus('phone', 'Please enter a phone number.', phoneRef);
        return;
      }
      if (!resaleTaxId.trim()) {
        highlightAndFocus('resaleTaxId', 'Please enter your Resale/Tax ID number.', resaleTaxIdRef);
        return;
      }
      if (!city.trim()) {
        highlightAndFocus('city', 'Please enter your city.', cityRef);
        return;
      }
      if (!zipCode.trim()) {
        highlightAndFocus('zipCode', 'Please enter your postal/zip code.', zipCodeRef);
        return;
      }
      if (!stateProvince.trim()) {
        highlightAndFocus('stateProvince', 'Please enter your state/province.', stateProvinceRef);
        return;
      }
      if (!country.trim()) {
        highlightAndFocus('country', 'Please enter your country.', countryRef);
        return;
      }
    }
    setErrorField('');
    setErrorMessage('');
    if (step < 3) setStep(step + 1);
  };

  const handlePrev = () => {
    setErrorField('');
    setErrorMessage('');
    if (step > 1) setStep(step - 1);
  };

  const processFiles = (files: File[]) => {
    const valid = files.filter(f => {
      const isAllowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'].includes(f.type);
      if (!isAllowed) {
        setSubmitError(`File "${f.name}" is not a valid format. Please upload PDF, JPG, or PNG.`);
      }
      return isAllowed;
    }).slice(0, 2);

    if (valid.length > 0) {
      setSubmitError('');
      setUploadedFiles(valid);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(Array.from(e.dataTransfer.files));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadedFiles.length === 0) {
      highlightAndFocus('certificates', 'Please upload your signed resale certificate before submitting.', dropZoneRef);
      setSubmitError('Please upload your signed resale certificate.');
      toast.error('Please upload your signed resale certificate.');
      return;
    }
    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match');
      toast.error('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setErrorField('');

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

      // Safely parse JSON response to handle empty bodies or server errors gracefully
      const responseText = await response.text();
      let data: any = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = { error: 'Server returned an unparseable response. Please check your backend connection.' };
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || `Failed to submit registration (Server Status: ${response.status})`);
      }

      setSubmitSuccess(true);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred during submission';
      setSubmitError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Live validation helpers
  const isValidEmail = (val: string) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  const isValidPhone = (val: string) => !val || /^[0-9\+\-\s\(\)]{7,20}$/.test(val.trim());
  const isValidUrl = (val: string) => !val || /^(https?:\/\/)?([\w\d\.-]+)\.([a-z\.]{2,6})(\/[\w\d\.-]*)*\/?$/i.test(val.trim());
  const isValidZip = (val: string) => !val || /^[A-Za-z0-9\s\-]{3,10}$/.test(val.trim());
  const isValidCity = (val: string) => !val || (val.trim().length >= 2 && !/^\d+$/.test(val.trim()));

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (submitSuccess) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.formCard} style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ fontSize: '3rem', color: '#52c41a', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
              <FiCheckCircle />
            </div>
            <h2 className={styles.stepTitle} style={{ color: '#001f3f' }}>Registration Submitted!</h2>
            <p className={styles.stepDesc} style={{ marginTop: '1rem', fontSize: '1.05rem', color: '#555' }}>
              Thank you, <strong>{firstName}</strong>. Your wholesale application has been received and is pending review by our team. We will notify you at <strong>{email}</strong> once your account is approved.
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

            {/* Error Banner */}
            {errorMessage && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                backgroundColor: '#fff1f0',
                border: '1px solid #ffa39e',
                color: '#cf1322',
                padding: '0.8rem 1rem',
                borderRadius: '4px',
                marginBottom: '1.5rem',
                fontSize: '0.9rem'
              }}>
                <FiAlertCircle style={{ flexShrink: 0, fontSize: '1.2rem' }} />
                <span>{errorMessage}</span>
              </div>
            )}

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
                          autoComplete="given-name"
                          value={firstName}
                          onChange={(e) => { setFirstName(e.target.value); if (errorField === 'firstName') setErrorField(''); }}
                          className={`${styles.input} ${errorField === 'firstName' ? styles.errorBlink : ''}`}
                          placeholder="First name"
                          required
                        />
                        <span className={styles.fieldHint}>First</span>
                      </div>
                      <div className={styles.nameField}>
                        <input
                          ref={lastNameRef}
                          type="text"
                          autoComplete="family-name"
                          value={lastName}
                          onChange={(e) => { setLastName(e.target.value); if (errorField === 'lastName') setErrorField(''); }}
                          className={`${styles.input} ${errorField === 'lastName' ? styles.errorBlink : ''}`}
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
                      autoComplete="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); if (errorField === 'email') setErrorField(''); }}
                      className={`${styles.input} ${(errorField === 'email' || !isValidEmail(email)) ? styles.errorBlink : ''}`}
                      placeholder="Email"
                      required
                    />
                    {!isValidEmail(email) && (
                      <span style={{ fontSize: '0.8rem', color: '#d9534f', marginTop: '0.2rem' }}>
                        ⚠️ Please enter a valid email address (e.g. name@company.com)
                      </span>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>How did you hear about us? <span className={styles.required}>*</span></label>
                    <select
                      ref={hearAboutRef}
                      value={hearAbout}
                      onChange={(e) => { setHearAbout(e.target.value); if (errorField === 'hearAbout') setErrorField(''); }}
                      className={`${styles.select} ${errorField === 'hearAbout' ? styles.errorBlink : ''}`}
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
                    <div style={{ position: 'relative' }}>
                      <input
                        ref={passwordRef}
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); if (errorField === 'password') setErrorField(''); }}
                        className={`${styles.input} ${errorField === 'password' ? styles.errorBlink : ''}`}
                        style={{ paddingRight: '2.8rem' }}
                        placeholder="Password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '0.8rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#666',
                          cursor: 'pointer',
                          padding: '0.3rem',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title={showPassword ? 'Hide Password' : 'Show Password'}
                      >
                        {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                      </button>
                    </div>
                    {password && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1, height: '5px', background: '#e8e8e8', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ 
                            height: '100%', 
                            width: strength.label === 'Weak' ? '33%' : strength.label === 'Medium' ? '66%' : '100%', 
                            background: strength.color,
                            transition: 'all 0.3s ease-in-out'
                          }} />
                        </div>
                        <span style={{ color: strength.color, fontWeight: 600, minWidth: '50px', fontSize: '0.8rem' }}>{strength.label}</span>
                      </div>
                    )}
                    {errorField === 'password' && strength.label === 'Weak' && (
                      <p style={{ color: '#ff4d4f', fontSize: '0.825rem', marginTop: '0.4rem' }}>
                        Password must be at least 8 characters long and include uppercase, lowercase, numbers &amp; symbols.
                      </p>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Confirm Password <span className={styles.required}>*</span></label>
                    <div style={{ position: 'relative' }}>
                      <input
                        ref={confirmPasswordRef}
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); if (errorField === 'confirmPassword') setErrorField(''); }}
                        className={`${styles.input} ${errorField === 'confirmPassword' ? styles.errorBlink : ''}`}
                        style={{ paddingRight: '2.8rem' }}
                        placeholder="Retype Password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{
                          position: 'absolute',
                          right: '0.8rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#666',
                          cursor: 'pointer',
                          padding: '0.3rem',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title={showConfirmPassword ? 'Hide Password' : 'Show Password'}
                      >
                        {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className={styles.btnRow}>
                  <button type="button" onClick={handleNext} className={styles.nextBtn}>
                    Next Step &rarr;
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
                      autoComplete="organization"
                      value={companyName}
                      onChange={(e) => { setCompanyName(e.target.value); if (errorField === 'companyName') setErrorField(''); }}
                      className={`${styles.input} ${errorField === 'companyName' ? styles.errorBlink : ''}`}
                      placeholder="Company Name"
                      required
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Company Website</label>
                    <input
                      ref={companyWebsiteRef}
                      type="url"
                      autoComplete="url"
                      value={companyWebsite}
                      onChange={(e) => { setCompanyWebsite(e.target.value); if (errorField === 'companyWebsite') setErrorField(''); }}
                      className={`${styles.input} ${(errorField === 'companyWebsite' || !isValidUrl(companyWebsite)) ? styles.errorBlink : ''}`}
                      placeholder="Company Website (e.g. www.example.com)"
                    />
                    {!isValidUrl(companyWebsite) && (
                      <span style={{ fontSize: '0.8rem', color: '#d9534f', marginTop: '0.2rem' }}>
                        ⚠️ Please enter a valid URL starting with http://, https://, or www. (e.g. www.mycompany.com)
                      </span>
                    )}
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
                      autoComplete="street-address"
                      value={addressLine}
                      onChange={(e) => { setAddressLine(e.target.value); if (errorField === 'addressLine') setErrorField(''); }}
                      className={`${styles.input} ${errorField === 'addressLine' ? styles.errorBlink : ''}`}
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
                        autoComplete="tel"
                        value={phone}
                        onChange={(e) => { setPhone(e.target.value); if (errorField === 'phone') setErrorField(''); }}
                        className={`${styles.input} ${(errorField === 'phone' || !isValidPhone(phone)) ? styles.errorBlink : ''}`}
                        placeholder="+1 (555) 123-4567"
                        required
                      />
                      {!isValidPhone(phone) && (
                        <span style={{ fontSize: '0.8rem', color: '#d9534f', marginTop: '0.2rem' }}>
                          ⚠️ Please enter a valid phone number with at least 7 digits (e.g. +1 555-123-4567)
                        </span>
                      )}
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
                      onChange={(e) => { setResaleTaxId(e.target.value); if (errorField === 'resaleTaxId') setErrorField(''); }}
                      className={`${styles.input} ${errorField === 'resaleTaxId' ? styles.errorBlink : ''}`}
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
                        autoComplete="address-level2"
                        value={city}
                        onChange={(e) => { setCity(e.target.value); if (errorField === 'city') setErrorField(''); }}
                        className={`${styles.input} ${(errorField === 'city' || !isValidCity(city)) ? styles.errorBlink : ''}`}
                        placeholder="City"
                        required
                      />
                      {!isValidCity(city) && (
                        <span style={{ fontSize: '0.8rem', color: '#d9534f', marginTop: '0.2rem' }}>
                          ⚠️ City name must be at least 2 letters
                        </span>
                      )}
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Postal / Zip Code <span className={styles.required}>*</span></label>
                      <input
                        ref={zipCodeRef}
                        type="text"
                        autoComplete="postal-code"
                        value={zipCode}
                        onChange={(e) => { setZipCode(e.target.value); if (errorField === 'zipCode') setErrorField(''); }}
                        className={`${styles.input} ${(errorField === 'zipCode' || !isValidZip(zipCode)) ? styles.errorBlink : ''}`}
                        placeholder="Postal / Zip Code"
                        required
                      />
                      {!isValidZip(zipCode) && (
                        <span style={{ fontSize: '0.8rem', color: '#d9534f', marginTop: '0.2rem' }}>
                          ⚠️ Zip/Postal code must be at least 3 characters (e.g. 10001 or M5V 2T6)
                        </span>
                      )}
                    </div>
                  </div>


                  <div className={styles.twoCol}>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>State / Province / Region <span className={styles.required}>*</span></label>
                      <input
                        ref={stateProvinceRef}
                        type="text"
                        autoComplete="address-level1"
                        value={stateProvince}
                        onChange={(e) => { setStateProvince(e.target.value); if (errorField === 'stateProvince') setErrorField(''); }}
                        className={`${styles.input} ${errorField === 'stateProvince' ? styles.errorBlink : ''}`}
                        placeholder="State / Province / Region"
                        required
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Country <span className={styles.required}>*</span></label>
                      <input
                        ref={countryRef}
                        type="text"
                        autoComplete="country-name"
                        value={country}
                        onChange={(e) => { setCountry(e.target.value); if (errorField === 'country') setErrorField(''); }}
                        className={`${styles.input} ${errorField === 'country' ? styles.errorBlink : ''}`}
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
                    &larr; Previous
                  </button>
                  <button type="button" onClick={handleNext} className={styles.nextBtn}>
                    Next Step &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* ===== STEP 3: Resale Certificate ===== */}
            {step === 3 && (
              <div className={styles.stepContent}>
                <h2 className={styles.stepTitle}>Resale Certificate</h2>
                <p className={styles.stepDesc}>
                  Please upload your completed &amp; signed Resale Certificate to gain full wholesale access to Crown Findings.
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
                  &darr; Download Resale Certificate Form (ST-120)
                </Link>

                <p className={styles.uploadInstructions}>
                  The Resale Certificate will open in a New Tab. Fill out the form, save it with your signature, and upload it below.
                </p>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Upload Signed Certificate <span className={styles.required}>*</span></label>
                  <div
                    ref={dropZoneRef}
                    tabIndex={0}
                    className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ''} ${errorField === 'certificates' ? styles.errorBlink : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleFileDrop}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      multiple
                      onChange={handleFileSelect}
                      className={styles.fileInput}
                    />
                    <div className={styles.dropIcon}>
                      <FiUploadCloud style={{ color: '#001f3f' }} />
                    </div>
                    <p className={styles.dropText}>Drag &amp; Drop Files, or <span className={styles.browseLink}>Browse Files</span> to Upload</p>
                    <p className={styles.dropHint}>Supports PDF, JPG, or PNG (up to 2 files, max 15MB each)</p>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className={styles.fileList}>
                      {uploadedFiles.map((file, idx) => (
                        <div key={idx} className={styles.fileItem}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
                            <FiFileText style={{ flexShrink: 0, color: '#001f3f' }} />
                            <span className={styles.fileName}>{file.name}</span>
                            <span style={{ fontSize: '0.75rem', color: '#888', flexShrink: 0 }}>({formatFileSize(file.size)})</span>
                          </div>
                          <button type="button" onClick={() => removeFile(idx)} className={styles.removeFile} title="Remove File">
                            <FiX />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {submitError && (
                  <div className={styles.errorText} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#cf1322',
                    backgroundColor: '#fff1f0',
                    border: '1px solid #ffa39e',
                    padding: '0.8rem 1rem',
                    borderRadius: '4px',
                    margin: '1.5rem 0 0.5rem',
                    fontSize: '0.9rem'
                  }}>
                    <FiAlertCircle style={{ flexShrink: 0 }} />
                    <span>{submitError}</span>
                  </div>
                )}

                <div className={styles.btnRow}>
                  <button type="button" onClick={handlePrev} className={styles.prevBtn} disabled={isSubmitting}>
                    &larr; Previous
                  </button>
                  <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting Application...' : 'Submit Registration Application'}
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

