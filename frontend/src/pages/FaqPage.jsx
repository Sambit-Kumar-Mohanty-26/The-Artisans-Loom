import React from 'react';
import './FaqPage.css';

const FaqPage = () => {
  const faqs = [
    {
      question: "What is The Artisan's Loom?",
      answer: "The Artisan's Loom is an online platform dedicated to connecting global customers with authentic, handmade treasures from India. We aim to empower skilled artisans and preserve traditional Indian craftsmanship."
    },
    {
      question: "How do you ensure the authenticity of products?",
      answer: "We work directly with artisan communities and conduct rigorous quality checks to ensure that every product listed on our platform is genuinely handmade and reflects the rich cultural heritage of its origin."
    },
    {
      question: "Do you support fair trade practices?",
      answer: "Absolutely. Fair trade is at the core of our values. We ensure that artisans receive fair compensation for their work, promoting sustainable livelihoods and ethical production practices."
    },
    {
      question: "What types of products can I find on The Artisan's Loom?",
      answer: "You can find a diverse range of handcrafted products, including textiles, pottery, jewelry, paintings, wooden crafts, and more, all made by talented artisans across India."
    },
    {
      question: "How does shipping work?",
      answer: "We offer various shipping options to cater to your needs. Shipping details, including costs and delivery times, are provided at checkout. We partner with reliable logistics providers to ensure your order reaches you safely."
    }
  ];

  return (
    <div className="faq-container">
      <h1 className="faq-title">Frequently Asked Questions</h1>
      <div className="faq-list">
        {faqs.map((faq, index) => (
          <div key={index} className="faq-item">
            <h2 className="faq-question">{faq.question}</h2>
            <p className="faq-answer">{faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FaqPage;
