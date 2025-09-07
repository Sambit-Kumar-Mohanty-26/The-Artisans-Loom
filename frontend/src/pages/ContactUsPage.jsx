import React from 'react';
import './ContactUsPage.css';

const ContactUsPage = () => {
  return (
    <div className="contact-us-container">
      <h1 className="contact-us-title">Contact Us</h1>
      <section className="contact-us-section">
        <p>If you have any questions or inquiries, please feel free to reach out to us:</p>
        <p><strong>Email:</strong> <a href="mailto:contact.artisans.loom@gmail.com">contact.artisans.loom@gmail.com</a></p>
      </section>
      <section className="contact-us-section">
        <p>We look forward to hearing from you!</p>
      </section>
    </div>
  );
};

export default ContactUsPage;
