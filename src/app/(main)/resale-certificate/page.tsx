'use client';
import React, { useState } from 'react';
import styles from './page.module.css';

export default function ResaleCertificatePage() {
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  
  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSignatureImage(event.target?.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleDownload = () => {
    window.print();
  };

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <h2>NYS Resale Certificate (ST-120)</h2>
        <p>Fill out the form below. When complete, click Download to save as a PDF.</p>
        <button onClick={handleDownload} className={styles.downloadBtn}>Download / Print Certificate</button>
      </div>

      <div className={styles.documentPage}>
        <div className={styles.header}>
          <div className={styles.logoArea}>
            <img src="/nys-logo.svg" alt="New York State" className={styles.nysLogo} />
          </div>
          <div className={styles.titleArea}>
            <div className={styles.deptText}>Department of Taxation and Finance</div>
            <div className={styles.mainTitle}>New York State and Local Sales and Use Tax</div>
            <div className={styles.subTitle}>Resale Certificate</div>
          </div>
          <div className={styles.formNumber}>
            <h2>ST-120</h2>
            <span>(6/18)</span>
          </div>
        </div>

        <div className={styles.grid2}>
          <div className={styles.gridCell}>
            <label>Name of seller</label>
            <input type="text" value="CROWN FINDINGS CO., INC." readOnly className={styles.boldInput} />
            <label>Street address</label>
            <input type="text" value="44 W 47TH ST., GF-12" readOnly />
            <div className={styles.addressRow}>
              <div><label>City</label><input type="text" value="NEW YORK" readOnly /></div>
              <div><label>State</label><input type="text" value="NY" readOnly /></div>
              <div><label>ZIP code</label><input type="text" value="10036" readOnly /></div>
            </div>
          </div>
          <div className={styles.gridCell}>
            <label>Name of purchaser</label>
            <input type="text" placeholder="Purchaser Name" />
            <label>Street address</label>
            <input type="text" placeholder="Street Address" />
            <div className={styles.addressRow}>
              <div><label>City</label><input type="text" placeholder="City" /></div>
              <div><label>State</label><input type="text" placeholder="State" /></div>
              <div><label>ZIP code</label><input type="text" placeholder="ZIP" /></div>
            </div>
          </div>
        </div>

        <div className={styles.certType}>
          <span>Mark an <strong>X</strong> in the appropriate box:</span>
          <label><input type="radio" name="cert_type" /> Single-use certificate</label>
          <label><input type="radio" name="cert_type" /> Blanket certificate</label>
          <div className={styles.smallNote}>Temporary vendors must issue a single-use certificate.</div>
        </div>

        <div className={styles.warningBox}>
          <strong>To the purchaser:</strong>
          <p>
            You may not use this certificate to purchase items or services that are not for resale. If you purchase tangible personal property or services 
            for resale, but use or consume the tangible personal property or services yourself in New York State, you must report and pay the unpaid tax 
            directly to New York State. Any misuse of this certificate will result in tax liabilities and substantial penalty and interest.
          </p>
        </div>

        <div className={styles.sectionBlock}>
          <strong>Purchaser information</strong> <span className={styles.italicText}>– please type or print</span>
          <div className={styles.inlineInputs}>
            I am engaged in the business of <input type="text" style={{ flex: 1 }} /> and principally sell <input type="text" style={{ flex: 1 }} />
          </div>
          <div className={styles.centerNote}>(Contractors may not use this certificate to purchase materials and supplies.)</div>
        </div>

        <div className={styles.partSection}>
          <div className={styles.partHeader}><strong>Part 1 – To be completed by registered New York State sales tax vendors</strong></div>
          <div className={styles.partBody}>
            <strong>I certify that I am:</strong>
            <div className={styles.checkboxRow}>
              <input type="checkbox" />
              <span>a New York State vendor (including a hotel operator or a dues or admissions recipient), show vendor or entertainment vendor. My valid <em>Certificate of Authority</em> number is <input type="text" className={styles.inlineLine} /></span>
            </div>
            <div className={styles.checkboxRow}>
              <input type="checkbox" />
              <span>a New York State temporary vendor. My valid <em>Certificate of Authority</em> number is <input type="text" className={styles.inlineLine} /> and expires on <input type="text" className={styles.inlineLine} /></span>
            </div>
            
            <div style={{ marginTop: '10px' }}><strong>I am purchasing:</strong></div>
            <div className={styles.checkboxRow}>
              <input type="checkbox" />
              <div className={styles.listText}>
                <strong>A.</strong> Tangible personal property (other than motor fuel or diesel motor fuel)
                <ul>
                  <li>for resale in its present form or for resale as a physical component part of tangible personal property;</li>
                  <li>for use in performing taxable services where the property will become a physical component part of the property upon which the services will be performed, or the property will actually be transferred to the purchaser of the taxable service in conjunction with the performance of the service; or</li>
                </ul>
              </div>
            </div>
            <div className={styles.checkboxRow}>
              <input type="checkbox" />
              <span><strong>B.</strong> A service for resale, including the servicing of tangible personal property held for sale.</span>
            </div>
            <div className={styles.checkboxRow}>
              <input type="checkbox" />
              <span><strong>C.</strong> Restaurant-type food, heated food, or heated drink for resale.</span>
            </div>
          </div>
        </div>

        <div className={styles.partSection}>
          <div className={styles.partHeader}><strong>Part 2 – To be completed by non-New York State purchasers</strong></div>
          <div className={styles.partBody}>
            <p className={styles.denseText}>
              <strong>I certify that I am</strong> not registered nor am I required to be registered as a New York State sales tax vendor. I am registered to collect sales tax or value added tax (VAT) in the following state/jurisdiction <input type="text" className={styles.inlineLine} style={{ width: '200px' }} /> and have been issued the following registration number <input type="text" className={styles.inlineLine} style={{ width: '200px' }} /> (If sales tax or VAT registration is not required and a registration number is not issued by your home jurisdiction, indicate the location of your business and write <em>not applicable</em> on the line requesting the registration number.)
            </p>
            
            <div style={{ marginTop: '10px' }}><strong>I am purchasing:</strong></div>
            <div className={styles.checkboxRow}>
              <input type="checkbox" />
              <span><strong>D.</strong> Tangible personal property (other than motor fuel or diesel motor fuel) for resale, and it is being delivered directly by the seller to my customer or to an unaffiliated fulfillment services provider in New York State.</span>
            </div>
            <div className={styles.checkboxRow}>
              <input type="checkbox" />
              <span><strong>E.</strong> Tangible personal property for resale that will be resold from a business located outside New York State.</span>
            </div>
          </div>
        </div>

        <div className={styles.certificationBlock}>
          <strong>Certification:</strong> I certify that the above statements are true, complete, and correct, and that no material information has been omitted. I make these 
          statements and issue this exemption certificate with the knowledge that this document provides evidence that state and local sales or use taxes 
          do not apply to a transaction or transactions for which I tendered this document and that willfully issuing this document with the intent to evade 
          any such tax may constitute a felony or other crime under New York State Law, punishable by a substantial fine and a possible jail sentence. 
          I understand that this document is required to be filed with, and delivered to, the vendor as agent for the Tax Department for the purposes of 
          Tax Law section 1838 and is deemed a document required to be filed with the Tax Department for the purpose of prosecution of offenses. I also 
          understand that the Tax Department is authorized to investigate the validity of tax exclusions or exemptions claimed and the accuracy of any 
          information entered on this document.
        </div>

        <div className={styles.signatureGrid}>
          <div className={styles.sigCellFull}>
            <label>Type or print name and title of owner, partner, or authorized person of purchaser</label>
            <input type="text" />
            <div className={styles.contactRow}>
              <div>PHONE: <input type="text" /></div>
              <div>EMAIL: <input type="text" /></div>
            </div>
          </div>
          <div className={styles.sigCellLeft}>
            <div className={styles.sigHeader}>
              <label>Signature of owner, partner, or authorized person of purchaser</label>
              <div className={styles.noPrint}>
                <input type="file" accept="image/*" id="sig-upload" onChange={handleSignatureUpload} style={{ display: 'none' }} />
                <label htmlFor="sig-upload" className={styles.uploadBtn}>Upload Signature Image</label>
              </div>
            </div>
            <div className={styles.signatureBox}>
              {signatureImage ? (
                <img src={signatureImage} alt="Signature" className={styles.sigImage} />
              ) : (
                <div className={styles.sigPlaceholder}>Sign here (or upload image)</div>
              )}
            </div>
          </div>
          <div className={styles.sigCellRight}>
            <label>Date prepared</label>
            <input type="date" />
          </div>
        </div>
        
        <div className={styles.footerNote}>
          <strong>Substantial penalties will result from misuse of this certificate.</strong>
        </div>

      </div>

      <div className={styles.pageBreak}></div>

      <div className={styles.instructionsPage}>
        <div className={styles.instructionsHeader}>
          <span>Page 2 of 2 <strong>ST-120</strong> (6/18)</span>
          <h2>Instructions</h2>
        </div>

        <div className={styles.instructionsColumns}>
          <div className={styles.instructionsCol}>
            <p><strong>New:</strong> Effective June 1, 2018, use box C in Part 1 to purchase restaurant-type food or drink for resale. For more information, see <a href="#">TSB-M-18(1)S</a>, <em>Summary of Sales and Use Tax Changes Enacted in the 2018-2019 Budget Bill</em>.</p>
            <p>Form ST-120, <em>Resale Certificate</em>, is a sales tax exemption certificate.</p>
            
            <h3>This certificate is only for use by a purchaser who:</h3>
            <ul>
              <li><strong>A</strong> – is registered as a New York State sales tax vendor and has a valid <em>Certificate of Authority</em> issued by the Tax Department and is making purchases of tangible personal property (other than motor fuel or diesel motor fuel) or services that will be resold or transferred to the purchaser’s customers, <strong>or</strong></li>
              <li><strong>B</strong> – is not required to be registered with the New York State Tax Department;
                <ul>
                  <li>– is registered with another state, the District of Columbia, a province of Canada, or other country, or is located in a state, province, or country which does not require sellers to register for sales tax or VAT purposes; and</li>
                  <li>– is purchasing items for resale that will be either:
                    <ol>
                      <li>1) delivered by the seller to the purchaser’s customer or to an unaffiliated fulfillment service provider located in New York State, or</li>
                      <li>2) delivered to the purchaser in New York State, but resold from a business located outside the state.</li>
                    </ol>
                  </li>
                </ul>
              </li>
            </ul>
            <p><strong>Note:</strong> For purposes of 1) above, delivery by the seller includes delivery in the seller’s own vehicle or by common carrier, regardless of who arranges for the transportation.</p>

            <h3>Non-New York State purchasers: registration requirements</h3>
            <p>If, among other things, a purchaser has any place of business or salespeople in New York State, or owns or leases tangible personal property in the State, the purchaser is required to be registered for New York State sales tax.</p>
            <p>A business must register (unless the business can rebut the statutory presumption as described in TSB-M-08(3.1)S, <em>Additional Information on How Sellers May Rebut the New Presumption Applicable to the Definition of Sales Tax Vendor as Described in TSB-M-08(3)S</em>) for New York State sales tax if the business enters into agreements with residents of New York State under which the residents receive consideration for referring potential customers to the business by links on a Web site or otherwise, and the value of the sales in New York State made by the business through those agreements totals more than $10,000 in the preceding four sales tax quarters. See TSB-M-08(3)S, <em>New Presumption Applicable to Definition of Sales Tax Vendor</em>, and TSB-M-08(3.1)S.</p>
            <p>Also see TSB-M-09(3)S, <em>Definition of a Sales Tax Vendor is Expanded to Include Out-of-State Sellers with Related Businesses in New York State</em>, for information on sales tax registration requirements for out-of-state businesses with New York affiliates.</p>
            <p>A purchaser who is not otherwise required to be registered for New York State sales tax may purchase fulfillment services from an <strong>unaffiliated</strong> New York fulfillment service provider and have its tangible personal property located on the premises of the provider without being required to be registered for sales tax in New York State.</p>
            <p>If you need help determining if you are required to register because you engage in activity in New York State, contact the department (see <em>Need help?</em>).</p>
            <p>If you meet the registration requirements and engage in business activities in New York State without possessing a valid <em>Certificate of Authority</em>, you will be subject to penalty of up to $500 for the first day on which you make a sale or purchase, and up to $200 for each additional day, up to a maximum of $10,000.</p>

            <h3>Limitations on use</h3>
            <p>Contractors <strong>cannot</strong> use this certificate. They must either:</p>
            <ul>
              <li>issue Form ST-120.1, <em>Contractor Exempt Purchase Certificate</em>, if the tangible personal property being purchased qualifies for exemption as specified by the certificate, or</li>
              <li>issue Form AU-297, <em>Direct Payment Permit</em>, or</li>
              <li>pay sales tax at the time of purchase.</li>
            </ul>
            <p>Contractors are entitled to a refund or credit of sales tax paid on materials used in repairing, servicing or maintaining real property, if the materials are transferred to the purchaser of the taxable service in conjunction with the performance of the service. For additional information, see Publication 862, <em>Sales and Use Tax Classifications of Capital Improvements and Repairs to Real Property</em>.</p>
          </div>

          <div className={styles.instructionsCol}>
            <h3>To the Purchaser</h3>
            <p>Enter all the information requested on the front of this form.</p>
            <p>You may mark an <strong>X</strong> in the <em>Blanket certificate</em> box to cover all purchases of the same general type of property or service purchased for resale. If you do not mark an <strong>X</strong> in the <em>Blanket certificate</em> box, the certificate will be deemed a <em>Single-use certificate</em>. Temporary vendors may not issue a blanket certificate. A <em>temporary vendor</em> is a vendor (other than a show or entertainment vendor), who, in no more than two consecutive quarters in any 12-month period, makes sales of tangible personal property or services that are subject to tax.</p>
            <p>This certificate does not exempt prepaid sales tax on cigarettes. This certificate may not be used to purchase motor fuel or diesel motor fuel.</p>

            <h3>Misuse of this certificate</h3>
            <p>Misuse of this exemption certificate may subject you to serious civil and criminal sanctions in addition to the payment of any tax and interest due. These include:</p>
            <ul>
              <li>A penalty equal to 100% of the tax due;</li>
              <li>A $50 penalty for each fraudulent exemption certificate issued;</li>
              <li>Criminal felony prosecution, punishable by a substantial fine and a possible jail sentence; and</li>
              <li>Revocation of your <em>Certificate of Authority</em>, if you are required to be registered as a vendor. See TSB-M-09(17)S, <em>Amendments that Encourage Compliance with the Tax Law and Enhance the Tax Department’s Enforcement Ability</em>, for more information.</li>
            </ul>

            <h3>To the Seller</h3>
            <p>If you are a New York State registered vendor and accept an exemption document, you will be protected from liability for the tax, if the certificate is valid.</p>
            <p>The certificate will be considered valid if it was:</p>
            <ul>
              <li>accepted in good faith;</li>
              <li>in the vendor’s possession within 90 days of the transaction; and</li>
              <li>properly completed (all required entries were made).</li>
            </ul>
            <p>A certificate is accepted in good faith when a seller has no knowledge that the exemption certificate is false or is fraudulently given, and reasonable ordinary due care is exercised in the acceptance of the certificate.</p>
            <p>You must get a properly completed exemption certificate from your customer no later than 90 days after the delivery of the property or the performance of the service. When you receive a certificate after the 90 days, both you and the purchaser are subject to the burden of proving that the sale was exempt, and additional documentation may be required. An exemption certificate received on time that is not properly completed will be considered satisfactory if the deficiency is corrected within a reasonable period. You must also maintain a method of associating an invoice (or other source document) for an exempt sale made to a customer with the exemption certificate you have on file from that customer.</p>
            <p><strong>Invalid exemption certificates</strong> – Sales transactions which are not supported by valid exemption certificates are deemed to be taxable retail sales. The burden of proof that the tax was not required to be collected is upon the seller.</p>
            <p><strong>Retention of exemption certificates - You must keep this certificate for at least three years</strong> after the due date of the return to which it relates, or the date the return was filed, if later.</p>

            <div className={styles.helpBox}>
              <h2>Need help?</h2>
              <strong>Visit our website at www.tax.ny.gov</strong>
              <ul>
                <li>get information and manage your taxes online</li>
                <li>check for new online services and features</li>
              </ul>
              <strong>Telephone assistance</strong>
              <div className={styles.helpContact}>
                <span>Sales Tax Information Center:</span>
                <span>518-485-2889</span>
              </div>
              <div className={styles.helpContact}>
                <span>To order forms and publications:</span>
                <span>518-457-5431</span>
              </div>
              <div className={styles.helpContact}>
                <span>Text Telephone (TTY) or TDD equipment users</span>
                <span>Dial 7-1-1 for the New York Relay Service</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
