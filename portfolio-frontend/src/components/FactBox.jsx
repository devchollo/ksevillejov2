import React from 'react';
import { Info } from 'lucide-react';

const FactBox = ({ title, facts, category = "general", icon = null }) => {
  return (
    <div 
      className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 p-6 my-8 rounded-r-xl shadow-lg"
      itemScope 
      itemType="https://schema.org/FactCheck"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          {icon || <Info className="w-8 h-8 text-amber-600" />}
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-xl mb-4 text-amber-900" itemProp="name">
            {title}
          </h3>
          <ul className="space-y-2" itemProp="text">
            {facts.map((fact, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="text-amber-600 font-bold mt-1 flex-shrink-0">✓</span>
                <span className="text-stone-800 leading-relaxed">{fact}</span>
              </li>
            ))}
          </ul>
          <meta itemProp="about" content={category} />
          <meta itemProp="datePublished" content={new Date().toISOString()} />
        </div>
      </div>
    </div>
  );
};

export default FactBox;