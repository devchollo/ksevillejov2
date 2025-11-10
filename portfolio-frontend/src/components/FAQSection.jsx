import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FAQSection = ({ faqs, title = "Frequently Asked Questions" }) => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div 
      className="bg-white rounded-3xl p-8 my-12 shadow-xl"
      itemScope 
      itemType="https://schema.org/FAQPage"
    >
      <h2 className="text-3xl font-bold mb-8 text-center text-stone-900">
        {title}
      </h2>
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div 
            key={index}
            className="border-2 border-stone-200 rounded-xl overflow-hidden hover:border-amber-300 transition-colors"
            itemScope
            itemProp="mainEntity"
            itemType="https://schema.org/Question"
          >
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full px-6 py-4 flex justify-between items-center text-left hover:bg-stone-50 transition-colors"
              aria-expanded={openIndex === index}
            >
              <h3 
                className="text-lg font-bold text-stone-900 pr-4"
                itemProp="name"
              >
                {faq.question}
              </h3>
              <div className="flex-shrink-0">
                {openIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-amber-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-stone-600" />
                )}
              </div>
            </button>
            
            {openIndex === index && (
              <div 
                className="px-6 pb-4"
                itemScope
                itemProp="acceptedAnswer"
                itemType="https://schema.org/Answer"
              >
                <div 
                  className="text-stone-700 leading-relaxed pt-2 border-t border-stone-200"
                  itemProp="text"
                  dangerouslySetInnerHTML={{ __html: faq.answer }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQSection;