import React from 'react';
import { Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-200 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-xl font-bold text-slate-900 tracking-tight">
                Dental<span className="text-brand-600">AI</span>
              </span>
            </div>
            <p className="text-slate-500 max-w-sm">
              Revolutionizing dental care with advanced AI detection. 
              Upload scans, get instant preliminary diagnoses, and connect with top-rated dentists.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Platform</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-slate-500 hover:text-brand-600 transition-colors">How it works</a></li>
              <li><a href="#" className="text-slate-500 hover:text-brand-600 transition-colors">Our AI Technology</a></li>
              <li><a href="#" className="text-slate-500 hover:text-brand-600 transition-colors">For Dentists</a></li>
              <li><a href="#" className="text-slate-500 hover:text-brand-600 transition-colors">Pricing</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Legal</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-slate-500 hover:text-brand-600 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-slate-500 hover:text-brand-600 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-slate-500 hover:text-brand-600 transition-colors">HIPAA Compliance</a></li>
              <li><a href="#" className="text-slate-500 hover:text-brand-600 transition-colors">Contact Us</a></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center">
          <p className="text-slate-400 text-sm">
            © {new Date().getFullYear()} Dental Genie Diagnosis Platform. All rights reserved.
          </p>
          <p className="text-slate-400 text-sm mt-2 md:mt-0 flex items-center">
            Made with <Heart className="w-4 h-4 text-red-500 mx-1" /> for better oral health
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
